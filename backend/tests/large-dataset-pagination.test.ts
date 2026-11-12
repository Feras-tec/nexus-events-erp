import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const url = process.env.TEST_PAGINATION_DATABASE_URL || process.env.TEST_QUOTE_DATABASE_URL;
if (url) {
  const parsed = new URL(url);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) ||
      !parsed.pathname.startsWith("/test_")) {
    throw new Error("TEST_PAGINATION_DATABASE_URL muss eine lokale test_-Datenbank sein");
  }
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url ?? "postgresql://localhost/test_pagination_unused" }) });
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ default: db }));
const { getInvoices } = await import("../src/controllers/invoice.controller.js");
const { getQuotes } = await import("../src/controllers/quote.controller.js");

const app = express();
app.use(express.json());
app.get("/invoices", getInvoices);
app.get("/quotes", getQuotes);

const integration = url ? describe : describe.skip;
integration("Große Datenmengen – Pagination und Performance", () => {
  let customerId: string;

  beforeAll(async () => {
    const suffix = crypto.randomUUID();
    customerId = (await db.customer.create({ data: { customerNo: suffix } })).id;
    // 200 Rechnungen anlegen
    const data = Array.from({ length: 200 }, (_, i) => ({
      invoiceNo: `PERF-${suffix}-${i}`,
      customerId,
      status: "DRAFT" as const,
      subtotal: 10,
      total: 11.9,
      tax: 19,
      discount: 0,
      items: { create: [{ type: "SERVICE" as const, description: "x", quantity: 1, unitPrice: 10, total: 10 }] },
    }));
    await db.invoice.createMany({ data: data.map(({ items: _items, ...rest }) => rest) });
    // items separat
    const invoices = await db.invoice.findMany({ where: { customerId }, select: { id: true } });
    await db.invoiceItem.createMany({ data: invoices.map(inv => ({ invoiceId: inv.id, type: "SERVICE", description: "x", quantity: 1, unitPrice: 10, total: 10 })) });
  }, 60000);

  afterAll(async () => {
    await db.invoiceItem.deleteMany({ where: { invoice: { customerId } } });
    await db.invoice.deleteMany({ where: { customerId } });
    await db.customer.delete({ where: { id: customerId } });
    await db.$disconnect();
  });

  it("paginiert Rechnungen korrekt (take/skip)", async () => {
    const first = await request(app).get("/invoices?take=50");
    expect(first.status).toBe(200);
    expect(first.body).toHaveLength(50);

    const second = await request(app).get("/invoices?skip=50&take=50");
    expect(second.status).toBe(200);
    expect(second.body).toHaveLength(50);
    // keine Überschneidung
    const firstIds = new Set(first.body.map((i: { id: string }) => i.id));
    expect(second.body.some((i: { id: string }) => firstIds.has(i.id))).toBe(false);
  });

  it("lehnt ungültige Pagination-Parameter ab", async () => {
    const r1 = await request(app).get("/invoices?skip=-1");
    expect(r1.status).toBe(400);
    const r2 = await request(app).get("/invoices?take=0");
    expect(r2.status).toBe(400);
  });

  it("lädt 200 Rechnungen innerhalb von 5 Sekunden", async () => {
    const start = Date.now();
    const res = await request(app).get("/invoices");
    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(200);
    expect(elapsed).toBeLessThan(5000);
  });
});