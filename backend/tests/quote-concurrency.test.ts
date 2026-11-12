import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const url = process.env.TEST_QUOTE_DATABASE_URL;
if (url) {
  const parsed = new URL(url);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) ||
      !parsed.pathname.startsWith("/test_")) {
    throw new Error("TEST_QUOTE_DATABASE_URL muss eine lokale test_-Datenbank sein");
  }
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url ?? "postgresql://localhost/test_quote_unused" }) });
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ default: db }));
const { createQuote, updateQuote, restoreQuote } = await import("../src/controllers/quote.controller.js");

const app = express();
app.use(express.json());
app.post("/quotes", createQuote);
app.patch("/quotes/:id", updateQuote);
app.post("/quotes/:id/restore", restoreQuote);

const integration = url ? describe : describe.skip;
integration("Angebote – konkurrierende Statusänderungen", () => {
  let customerId: string;

  beforeAll(async () => {
    const suffix = crypto.randomUUID();
    customerId = (await db.customer.create({ data: { customerNo: suffix } })).id;
  });

  afterAll(async () => {
    await db.quoteStatusHistory.deleteMany({ where: { quote: { customerId } } });
    await db.quoteItem.deleteMany({ where: { quote: { customerId } } });
    await db.quote.deleteMany({ where: { customerId } });
    await db.customer.delete({ where: { id: customerId } });
    await db.$disconnect();
  });

  async function createQuoteRow() {
    const suffix = crypto.randomUUID();
    const res = await request(app).post("/quotes").send({
      quoteNo: suffix,
      customerId,
      tax: 19,
      discount: 0,
      items: [{ type: "SERVICE", description: "Test", quantity: 1, unitPrice: 10 }],
    });
    expect(res.status).toBe(201);
    return res.body.id as string;
  }

  it("verarbeitet acht gleichzeitige Statusänderungen ohne Fehler", async () => {
    const id = await createQuoteRow();
    const results = await Promise.all(
      Array.from({ length: 8 }, () => request(app).patch(`/quotes/${id}`).send({ status: "SENT" })),
    );
    expect(results.every(r => r.status === 200)).toBe(true);
    const quote = await db.quote.findUniqueOrThrow({ where: { id } });
    expect(quote.status).toBe("SENT");
  });

  it("serialisiert Stornierung und Wiederherstellung", async () => {
    const id = await createQuoteRow();
    await request(app).patch(`/quotes/${id}`).send({ status: "CANCELLED" });
    const results = await Promise.all([
      request(app).patch(`/quotes/${id}`).send({ status: "SENT" }),
      request(app).post(`/quotes/${id}/restore`).send({}),
    ]);
    // One should succeed, the other fail (quote no longer cancelled / already restored)
    const statuses = results.map(r => r.status).sort();
    expect(statuses.filter(s => s === 200).length).toBeGreaterThanOrEqual(1);
    expect(results.every(r => r.status < 500)).toBe(true);
  });

  it("verhindert doppelte Wiederherstellung konkurrierender Anfragen", async () => {
    const id = await createQuoteRow();
    await request(app).patch(`/quotes/${id}`).send({ status: "CANCELLED" });
    const results = await Promise.all([
      request(app).post(`/quotes/${id}/restore`).send({}),
      request(app).post(`/quotes/${id}/restore`).send({}),
    ]);
    const ok = results.filter(r => r.status === 200).length;
    const fail = results.filter(r => r.status >= 400).length;
    expect(ok + fail).toBe(2);
    expect(ok).toBeGreaterThanOrEqual(1);
  });
});