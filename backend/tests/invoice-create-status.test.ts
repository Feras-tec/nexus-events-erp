import type { Request, Response } from "express";
import { jest } from "@jest/globals";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const INVOICE_ID = "22222222-2222-4222-8222-222222222222";

const mockCustomerFindUnique = jest.fn<(...args: any[]) => Promise<any>>();
const mockTransaction = jest.fn<(...args: any[]) => Promise<any>>();
const mockInvoiceCreate = jest.fn<(...args: any[]) => Promise<any>>();

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: {
    customer: {
      findUnique: mockCustomerFindUnique,
    },
    $transaction: mockTransaction,
  },
}));

const { createInvoice } = await import(
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

function validInvoiceBody() {
  return {
    invoiceNo: "INV-TEST-1",
    customerId: CUSTOMER_ID,
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

describe("Rechnungserstellung", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCustomerFindUnique.mockResolvedValue({
      id: CUSTOMER_ID,
    });

    mockInvoiceCreate.mockResolvedValue({
      id: INVOICE_ID,
      status: "DRAFT",
    });

    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => unknown) =>
        callback({
          $queryRaw: jest.fn(),
          quote: {
            findUnique: jest.fn(),
          },
          invoice: {
            findFirst: jest.fn(),
            create: mockInvoiceCreate,
          },
        }),
    );
  });

  it("erzwingt bei neuen Rechnungen den Status DRAFT", async () => {
    const { res, status, json } = createResponse();

    await createInvoice(
      {
        body: {
          ...validInvoiceBody(),
          // Alte Clients dürfen den Status nicht setzen.
          status: "PAID",
        },
      } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      id: INVOICE_ID,
      status: "DRAFT",
    });

    const createArgs = mockInvoiceCreate.mock.calls[0]?.[0];

    expect(createArgs.data.status).toBe("DRAFT");
  });
});
