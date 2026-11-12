import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const url = process.env.TEST_INVOICE_DATABASE_URL || process.env.TEST_QUOTE_DATABASE_URL;
if (url) {
  const parsed = new URL(url);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) ||
      !parsed.pathname.startsWith("/test_")) {
    throw new Error("TEST_INVOICE_DATABASE_URL muss eine lokale test_-Datenbank sein");
  }
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url ?? "postgresql://localhost/test_invoice_unused" }) });
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ default: db }));
const { createInvoice, updateInvoice } = await import("../src/controllers/invoice.controller.js");

const app = express();
app.use(express.json());
app.post("/invoices", createInvoice);
app.patch("/invoices/:id", updateInvoice);

const integration = url ? describe : describe.skip;
integration("Rechnungen – konkurrierende Statusänderungen", () => {
  let customerId: string;

  beforeAll(async () => {
    const suffix = crypto.randomUUID();
    customerId = (await db.customer.create({ data: { customerNo: suffix } })).id;
  });

  afterAll(async () => {
    await db.invoice.deleteMany({ where: { customerId } });
    await db.customer.delete({ where: { id: customerId } });
    await db.$disconnect();
  });

  async function createInvoiceRow() {
    const suffix = crypto.randomUUID();
    const res = await request(app).post("/invoices").send({
      invoiceNo: suffix,
      customerId,
      tax: 19,
      discount: 0,
      items: [{ type: "SERVICE", description: "Test", quantity: 1, unitPrice: 10 }],
    });
    expect(res.status).toBe(201);
    return res.body.id as string;
  }

  it("verarbeitet acht gleichzeitige Statusänderungen ohne Fehler", async () => {
    const id = await createInvoiceRow();
    const results = await Promise.all(
      Array.from({ length: 8 }, () => request(app).patch(`/invoices/${id}`).send({ status: "ISSUED" })),
    );
    expect(results.every(r => r.status === 200)).toBe(true);
    const invoice = await db.invoice.findUniqueOrThrow({ where: { id } });
    expect(invoice.status).toBe("ISSUED");
  });

  it("verhindert gleichzeitige Statusänderungen auf PAID/ISSUED ohne Absturz", async () => {
    const id = await createInvoiceRow();
    const results = await Promise.all([
      request(app).patch(`/invoices/${id}`).send({ status: "ISSUED" }),
      request(app).patch(`/invoices/${id}`).send({ status: "PAID" }),
    ]);
    expect(results.every(r => r.status < 500)).toBe(true);
  });
});