import type { Request, Response } from "express";
import { jest } from "@jest/globals";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const INVOICE_ID = "22222222-2222-4222-8222-222222222222";

function response() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { res: { status, json } as unknown as Response, status, json };
}

const mockCustomer = jest.fn<(...args: any[]) => Promise<any>>();
const mockProduct = jest.fn<(...args: any[]) => Promise<any>>();
const mockQuoteCreate = jest.fn<(...args: any[]) => Promise<any>>();
const mockInvoiceCreate = jest.fn<(...args: any[]) => Promise<any>>();
const mockTransaction = jest.fn<(...args: any[]) => Promise<any>>();

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: {
    customer: { findUnique: mockCustomer },
    product: { findMany: mockProduct },
    quote: { create: mockQuoteCreate },
    invoice: { findUnique: jest.fn(), findFirst: jest.fn(), create: mockInvoiceCreate },
    $transaction: mockTransaction,
  },
}));

const { createQuote } = await import("../src/controllers/quote.controller.js");
const { createInvoice } = await import("../src/controllers/invoice.controller.js");

describe("Finanzielle Rundung – Angebote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCustomer.mockResolvedValue({ id: CUSTOMER_ID });
    mockProduct.mockResolvedValue([]);
    mockQuoteCreate.mockResolvedValue({ id: "quote-1", status: "DRAFT" });
  });

  it("rundet Positionssummen und Steuern auf Cent-Basis (0.1 * 3)", async () => {
    const r = response();
    await createQuote(
      { body: { quoteNo: "Q-R1", customerId: CUSTOMER_ID, tax: 19, discount: 0, items: [{ type: "SERVICE", description: "x", quantity: 3, unitPrice: 0.1 }] } } as unknown as Request,
      r.res,
    );
    expect(r.status).toHaveBeenCalledWith(201);
    const data = (mockQuoteCreate.mock.calls[0]![0] as { data: any }).data;
    expect(data.subtotal).toBe(0.3);
    expect(data.total).toBe(0.36);
  });

  it("rundet Rabatte pro Position korrekt (33.333%)", async () => {
    const r = response();
    await createQuote(
      { body: { quoteNo: "Q-R2", customerId: CUSTOMER_ID, tax: 0, discount: 0, items: [{ type: "SERVICE", description: "x", quantity: 1, unitPrice: 10, discount: 33.333 }] } } as unknown as Request,
      r.res,
    );
    expect(r.status).toHaveBeenCalledWith(201);
    const data = (mockQuoteCreate.mock.calls[0]![0] as { data: any }).data;
    expect(data.subtotal).toBe(6.67);
    expect(data.total).toBe(6.67);
    expect(data.items.create[0].total).toBe(6.67);
  });

  it("Positionssummen addieren sich exakt zur Zwischensumme", async () => {
    const r = response();
    await createQuote(
      {
        body: {
          quoteNo: "Q-R3",
          customerId: CUSTOMER_ID,
          tax: 7,
          discount: 5,
          items: [
            { type: "SERVICE", description: "a", quantity: 2, unitPrice: 3.333, discount: 10 },
            { type: "SERVICE", description: "b", quantity: 1, unitPrice: 9.999, discount: 0 },
          ],
        },
      } as unknown as Request,
      r.res,
    );
    expect(r.status).toHaveBeenCalledWith(201);
    const data = (mockQuoteCreate.mock.calls[0]![0] as { data: any }).data;
    const itemCents = data.items.create.reduce((s: number, it: { total: number }) => s + Math.round(it.total * 100), 0);
    expect(itemCents).toBe(Math.round(data.subtotal * 100));
  });

  it("Gesamtrabatt und Steuer werden auf Cent-Basis berechnet", async () => {
    const r = response();
    await createQuote(
      { body: { quoteNo: "Q-R4", customerId: CUSTOMER_ID, tax: 19, discount: 10, items: [{ type: "SERVICE", description: "x", quantity: 1, unitPrice: 99.99 }] } } as unknown as Request,
      r.res,
    );
    expect(r.status).toHaveBeenCalledWith(201);
    const data = (mockQuoteCreate.mock.calls[0]![0] as { data: any }).data;
    expect(data.subtotal).toBe(99.99);
    expect(data.total).toBe(107.09);
  });
});

describe("Finanzielle Rundung – Rechnungen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCustomer.mockResolvedValue({ id: CUSTOMER_ID });
    mockProduct.mockResolvedValue([]);
    mockInvoiceCreate.mockResolvedValue({ id: INVOICE_ID, status: "DRAFT" });
    mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
      cb({
        $queryRaw: jest.fn(),
        quote: { findUnique: jest.fn() },
        invoice: { findFirst: jest.fn(), create: mockInvoiceCreate },
      }),
    );
  });

  it("rundet Positionssummen und Steuern auf Cent-Basis", async () => {
    const r = response();
    await createInvoice(
      { body: { invoiceNo: "INV-R1", customerId: CUSTOMER_ID, tax: 19, discount: 0, items: [{ type: "SERVICE", description: "x", quantity: 3, unitPrice: 0.1 }] } } as unknown as Request,
      r.res,
    );
    expect(r.status).toHaveBeenCalledWith(201);
    const args = mockInvoiceCreate.mock.calls[0]![0] as { data: any };
    expect(args.data.subtotal).toBe(0.3);
    expect(args.data.total).toBe(0.36);
  });

  it("Positionssummen addieren sich exakt zur Zwischensumme", async () => {
    const r = response();
    await createInvoice(
      {
        body: {
          invoiceNo: "INV-R2",
          customerId: CUSTOMER_ID,
          tax: 7,
          discount: 5,
          items: [
            { type: "SERVICE", description: "a", quantity: 2, unitPrice: 3.333, discount: 10 },
            { type: "SERVICE", description: "b", quantity: 1, unitPrice: 9.999, discount: 0 },
          ],
        },
      } as unknown as Request,
      r.res,
    );
    expect(r.status).toHaveBeenCalledWith(201);
    const args = mockInvoiceCreate.mock.calls[0]![0] as { data: any };
    const itemCents = args.data.items.create.reduce((s: number, it: { total: number }) => s + Math.round(it.total * 100), 0);
    expect(itemCents).toBe(Math.round(args.data.subtotal * 100));
  });

  it("Gesamtrabatt und Steuer werden auf Cent-Basis berechnet", async () => {
    const r = response();
    await createInvoice(
      { body: { invoiceNo: "INV-R3", customerId: CUSTOMER_ID, tax: 19, discount: 10, items: [{ type: "SERVICE", description: "x", quantity: 1, unitPrice: 99.99 }] } } as unknown as Request,
      r.res,
    );
    expect(r.status).toHaveBeenCalledWith(201);
    const args = mockInvoiceCreate.mock.calls[0]![0] as { data: any };
    expect(args.data.subtotal).toBe(99.99);
    expect(args.data.total).toBe(107.09);
  });
});