import type { Request, Response } from "express";
import { jest } from "@jest/globals";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const INVOICE_ID = "22222222-2222-4222-8222-222222222222";
const OLD_QUOTE_ID = "33333333-3333-4333-8333-333333333333";
const NEW_QUOTE_ID = "44444444-4444-4444-8444-444444444444";

const mockCustomerFindUnique = jest.fn<(...args: any[]) => Promise<any>>();
const mockQuoteFindUnique = jest.fn<(...args: any[]) => Promise<any>>();
const mockInvoiceFindUnique = jest.fn<(...args: any[]) => Promise<any>>();
const mockTransaction = jest.fn<(...args: any[]) => Promise<any>>();
const mockTxQueryRaw = jest.fn<(...args: any[]) => Promise<any>>();
const mockTxQuoteFindUnique = jest.fn<(...args: any[]) => Promise<any>>();
const mockTxInvoiceFindFirst = jest.fn<(...args: any[]) => Promise<any>>();
const mockTxInvoiceCreate = jest.fn<(...args: any[]) => Promise<any>>();
const mockTxInvoiceUpdate = jest.fn<(...args: any[]) => Promise<any>>();

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: {
    customer: {
      findUnique: mockCustomerFindUnique,
    },
    quote: {
      findUnique: mockQuoteFindUnique,
    },
    invoice: {
      findUnique: mockInvoiceFindUnique,
    },
    $transaction: mockTransaction,
  },
}));

const { createInvoice, updateInvoice } = await import(
  "../src/controllers/invoice.controller.js"
);

function createResponse() {
  const json = jest.fn();
  const status = jest.fn().mockImplementation(() => ({ json }));

  return {
    res: { status, json } as unknown as Response,
    status,
    json,
  };
}

function acceptedQuote(id: string) {
  return {
    id,
    customerId: CUSTOMER_ID,
    status: "ACCEPTED",
  };
}

function invoiceBody() {
  return {
    invoiceNo: "INV-TEST-2",
    customerId: CUSTOMER_ID,
    quoteId: NEW_QUOTE_ID,
    items: [
      {
        type: "SERVICE",
        description: "Testleistung",
        quantity: 1,
        unitPrice: 100,
      },
    ],
  };
}

function useTransactionMock() {
  mockTransaction.mockImplementation(
    async (callback: (tx: unknown) => unknown) =>
      callback({
        $queryRaw: mockTxQueryRaw,
        quote: {
          findUnique: mockTxQuoteFindUnique,
        },
        invoice: {
          findFirst: mockTxInvoiceFindFirst,
          create: mockTxInvoiceCreate,
          update: mockTxInvoiceUpdate,
        },
      }),
  );
}

describe("Eindeutigkeit von Rechnungen pro Angebot", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCustomerFindUnique.mockResolvedValue({
      id: CUSTOMER_ID,
    });

    mockQuoteFindUnique.mockResolvedValue(
      acceptedQuote(NEW_QUOTE_ID),
    );

    mockTxQuoteFindUnique.mockResolvedValue(
      acceptedQuote(NEW_QUOTE_ID),
    );

    useTransactionMock();
  });

  it("verhindert eine zweite aktive Rechnung für dasselbe Angebot", async () => {
    mockTxInvoiceFindFirst.mockResolvedValue({
      invoiceNo: "INV-EXISTING",
    });

    const { res, status, json } = createResponse();

    await createInvoice(
      {
        body: invoiceBody(),
      } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      error: "Quote already has an active invoice",
      invoiceNo: "INV-EXISTING",
    });

    expect(mockTxQueryRaw).toHaveBeenCalled();
    expect(mockTxInvoiceCreate).not.toHaveBeenCalled();
  });

  it("erlaubt eine Rechnung, wenn nur stornierte Rechnungen existieren", async () => {
    mockTxInvoiceFindFirst.mockResolvedValue(null);
    mockTxInvoiceCreate.mockResolvedValue({
      id: INVOICE_ID,
      status: "DRAFT",
    });

    const { res, status } = createResponse();

    await createInvoice(
      {
        body: invoiceBody(),
      } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(201);
    expect(mockTxInvoiceCreate).toHaveBeenCalled();
  });

  it("verhindert eine Angebotsänderung auf ein bereits fakturiertes Angebot", async () => {
    mockInvoiceFindUnique.mockResolvedValue({
      id: INVOICE_ID,
      status: "DRAFT",
      customerId: CUSTOMER_ID,
      quoteId: OLD_QUOTE_ID,
      discount: 0,
      tax: 19,
      items: [],
    });

    mockQuoteFindUnique.mockResolvedValue(
      acceptedQuote(NEW_QUOTE_ID),
    );

    mockTxInvoiceFindFirst.mockResolvedValue({
      invoiceNo: "INV-EXISTING",
    });

    const { res, status, json } = createResponse();

    await updateInvoice(
      {
        params: { id: INVOICE_ID },
        body: { quoteId: NEW_QUOTE_ID },
      } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      error: "Quote already has an active invoice",
      invoiceNo: "INV-EXISTING",
    });

    expect(mockTxQueryRaw).toHaveBeenCalled();
    expect(mockTxInvoiceUpdate).not.toHaveBeenCalled();
  });

  it("blockiert bestehende Rechnungen mit unverändertem Angebot nicht", async () => {
    mockInvoiceFindUnique.mockResolvedValue({
      id: INVOICE_ID,
      status: "DRAFT",
      customerId: CUSTOMER_ID,
      quoteId: NEW_QUOTE_ID,
      discount: 0,
      tax: 19,
      items: [],
    });

    mockTxInvoiceUpdate.mockResolvedValue({
      id: INVOICE_ID,
      status: "DRAFT",
    });

    const { res, json } = createResponse();

    await updateInvoice(
      {
        params: { id: INVOICE_ID },
        body: { notes: "Aktualisierte Notiz" },
      } as unknown as Request,
      res,
    );

    expect(json).toHaveBeenCalledWith({
      id: INVOICE_ID,
      status: "DRAFT",
    });
    expect(mockTxInvoiceFindFirst).not.toHaveBeenCalled();
    expect(mockTxInvoiceUpdate).toHaveBeenCalled();
  });
});
