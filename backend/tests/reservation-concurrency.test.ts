import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

// Ausschließlich eine ausdrücklich angegebene lokale Testdatenbank verwenden, niemals DATABASE_URL.
const url = process.env.TEST_RESERVATION_DATABASE_URL;
if (url) {
  const parsed = new URL(url);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) ||
      !parsed.pathname.startsWith("/test_reservation")) {
    throw new Error("TEST_RESERVATION_DATABASE_URL muss eine lokale test_reservation-Datenbank sein");
  }
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url ?? "postgresql://localhost/test_reservation_unused" }) });
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ default: db }));
const { createReservation, updateReservation } = await import("../src/controllers/reservation.controller.js");
// Die echten HTTP-Anfragen prüfen den Reservierungscontroller ohne externe Clerk-Abhängigkeit.
const app = express();
app.use(express.json());
app.post("/reservations", createReservation);
app.patch("/reservations/:id", updateReservation);

// Ohne explizite Testdatenbank bleiben die schreibenden Integrationstests deaktiviert.
const integration = url ? describe : describe.skip;
integration("Reservierungen mit echten PostgreSQL-Zeilensperren", () => {
  let companyId: string, branchId: string, warehouseId: string;
  let productId: string, customerId: string, eventId: string, itemId: string;
  const startDate = new Date("2026-11-12T10:00:00Z");
  const endDate = new Date("2026-11-12T18:00:00Z");

  beforeAll(async () => {
    // Eindeutige Testdaten werden nur in der abgesicherten lokalen Datenbank angelegt.
    const suffix = crypto.randomUUID();
    companyId = (await db.company.create({ data: { name: suffix } })).id;
    branchId = (await db.branch.create({ data: { name: suffix, code: suffix, city: "Test", companyId } })).id;
    warehouseId = (await db.warehouse.create({ data: { name: suffix, code: suffix, branchId } })).id;
    productId = (await db.product.create({ data: { name: suffix, productNo: suffix } })).id;
    customerId = (await db.customer.create({ data: { customerNo: suffix } })).id;
    eventId = (await db.event.create({ data: { name: suffix, eventNo: suffix, customerId, startDate, endDate } })).id;
    itemId = (await db.inventoryItem.create({ data: { assetNo: suffix, productId, warehouseId } })).id;
  });

  beforeEach(async () => {
    await db.reservation.deleteMany({ where: { inventoryItemId: itemId } });
    await db.inventoryItem.update({ where: { id: itemId }, data: { status: "AVAILABLE" } });
  });

  afterAll(async () => {
    // Nur die eigenen Testdatensätze in umgekehrter Fremdschlüsselreihenfolge entfernen.
    if (itemId) {
      await db.reservation.deleteMany({ where: { inventoryItemId: itemId } });
      await db.inventoryItem.delete({ where: { id: itemId } });
    }
    if (eventId) await db.event.delete({ where: { id: eventId } });
    if (customerId) await db.customer.delete({ where: { id: customerId } });
    if (productId) await db.product.delete({ where: { id: productId } });
    if (warehouseId) await db.warehouse.delete({ where: { id: warehouseId } });
    if (branchId) await db.branch.delete({ where: { id: branchId } });
    if (companyId) await db.company.delete({ where: { id: companyId } });
    await db.$disconnect();
  });

  async function call(body: object, id?: string) {
    const response = await (id
      ? request(app).patch(`/reservations/${id}`).send(body)
      : request(app).post("/reservations").send(body));
    return { statusCode: response.status, payload: response.body as unknown };
  }
  function create(body: object = {}) {
    return call({ eventId, inventoryItemId: itemId, startDate, endDate, ...body });
  }
  async function seed(status: "CANCELLED" | "CONFIRMED" = "CANCELLED") {
    return db.reservation.create({ data: { eventId, inventoryItemId: itemId, startDate, endDate, status } });
  }

  it("lässt bei acht gleichzeitigen überlappenden Anlagen genau eine Buchung zu", async () => {
    const results = await Promise.all(Array.from({ length: 8 }, () => create()));
    expect(results.filter(r => r.statusCode === 201)).toHaveLength(1);
    expect(results.filter(r => r.statusCode === 409)).toHaveLength(7);
    expect(await db.reservation.count({ where: { inventoryItemId: itemId } })).toBe(1);
    expect(results.find(r => r.statusCode === 409)?.payload).toEqual({ error: "Inventory item is already reserved for this period" });
  });

  it("serialisiert Anlage und gleichzeitige Reaktivierung", async () => {
    const reservation = await seed();
    const results = await Promise.all([create(), call({ status: "CONFIRMED" }, reservation.id)]);
    expect(results.filter(r => [200, 201].includes(r.statusCode))).toHaveLength(1);
    expect(results.filter(r => r.statusCode === 409)).toHaveLength(1);
  });

  it("verhindert gleichzeitige Reaktivierungen zweier stornierter Buchungen", async () => {
    const first = await seed(), second = await seed();
    const results = await Promise.all([call({ status: "CONFIRMED" }, first.id), call({ status: "CONFIRMED" }, second.id)]);
    expect(results.map(r => r.statusCode).sort()).toEqual([200, 409]);
  });

  it("verhindert konkurrierende Terminverschiebungen in denselben freien Zeitraum", async () => {
    const first = await seed("CONFIRMED");
    await db.reservation.update({ where: { id: first.id }, data: {
      startDate: new Date("2026-11-13T10:00:00Z"), endDate: new Date("2026-11-13T18:00:00Z"),
    } });
    const second = await seed("CONFIRMED");
    const target = { startDate: "2026-11-14T10:00:00Z", endDate: "2026-11-14T18:00:00Z" };
    const results = await Promise.all([call(target, first.id), call(target, second.id)]);
    expect(results.map(r => r.statusCode).sort()).toEqual([200, 409]);
  });

  it("verhindert Überschneidungen zwischen Anlage und Terminverschiebung", async () => {
    const existing = await seed("CONFIRMED");
    const target = { startDate: "2026-11-14T10:00:00Z", endDate: "2026-11-14T18:00:00Z" };
    const results = await Promise.all([create(target), call(target, existing.id)]);
    expect(results.filter(r => [200, 201].includes(r.statusCode))).toHaveLength(1);
    expect(results.filter(r => r.statusCode === 409)).toHaveLength(1);
  });

  it.each([
    ["2026-11-12T09:00:00Z", "2026-11-12T11:00:00Z"],
    ["2026-11-12T17:00:00Z", "2026-11-12T19:00:00Z"],
    ["2026-11-12T11:00:00Z", "2026-11-12T17:00:00Z"],
    ["2026-11-12T09:00:00Z", "2026-11-12T19:00:00Z"],
  ])("weist Überschneidung %s bis %s zurück", async (start, end) => {
    await seed("CONFIRMED");
    expect((await create({ startDate: start, endDate: end })).statusCode).toBe(409);
  });

  it("erlaubt direkt angrenzende Zeiträume", async () => {
    await seed("CONFIRMED");
    expect((await create({ startDate: endDate, endDate: "2026-11-12T20:00:00Z" })).statusCode).toBe(201);
    expect((await create({ startDate: "2026-11-12T08:00:00Z", endDate: startDate })).statusCode).toBe(201);
  });

  it.each(["PENDING_REGISTRATION", "LOST", "RETIRED"] as const)("verhindert Anlage und Reaktivierung bei %s, erlaubt aber Stornieren", async status => {
    const reservation = await seed();
    await db.inventoryItem.update({ where: { id: itemId }, data: { status } });
    expect((await create()).statusCode).toBe(400);
    expect((await call({ status: "CONFIRMED" }, reservation.id)).statusCode).toBe(400);
    expect((await call({ startDate: "2026-11-12T11:00:00Z", status: "CONFIRMED" }, reservation.id)).statusCode).toBe(400);
    expect((await call({ status: "CANCELLED" }, reservation.id)).statusCode).toBe(200);
  });

  it("erlaubt zukünftige Buchungen für bereits reservierte Geräte", async () => {
    await db.inventoryItem.update({ where: { id: itemId }, data: { status: "RESERVED" } });
    expect((await create()).statusCode).toBe(201);
  });

  it("erhält Notizänderungen, Abschluss und Stornierung nach Verlust eines Geräts", async () => {
    const existing = await seed("CONFIRMED");
    await db.inventoryItem.update({ where: { id: itemId }, data: { status: "LOST" } });
    expect((await call({ notes: "Verlust dokumentiert" }, existing.id)).statusCode).toBe(200);
    expect((await call({ status: "COMPLETED" }, existing.id)).statusCode).toBe(200);
    expect((await call({ status: "CANCELLED" }, existing.id)).statusCode).toBe(200);
  });

  it("prüft Teiländerungen gegen den gespeicherten Zeitraum", async () => {
    const existing = await seed("CONFIRMED");
    expect((await call({ startDate: "2026-11-12T19:00:00Z" }, existing.id)).statusCode).toBe(400);
    expect((await call({ endDate: "2026-11-12T09:00:00Z" }, existing.id)).statusCode).toBe(400);
    expect((await db.reservation.findUniqueOrThrow({ where: { id: existing.id } })).startDate).toEqual(startDate);
  });

  it("rollt Konflikte zurück und erlaubt danach die nächste gültige Änderung", async () => {
    const existing = await seed("CONFIRMED");
    expect((await call({ notes: "Notiz" }, existing.id)).statusCode).toBe(200);
    expect((await create()).statusCode).toBe(409);
    expect((await call({ status: "CANCELLED" }, existing.id)).statusCode).toBe(200);
    expect((await create()).statusCode).toBe(201);
  });
});
