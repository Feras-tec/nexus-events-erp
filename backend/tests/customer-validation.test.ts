import type { Request, Response } from "express";
import { jest } from "@jest/globals";

const mockCustomerCreate = jest.fn();

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: {
    customer: {
      create: mockCustomerCreate,
    },
  },
}));

const { createCustomer } = await import(
  "../src/controllers/customer.controller.js"
);

describe("Customer Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sollte Firmenkunden ohne Firmennamen ablehnen", async () => {
    const req = {
      body: {
        customerNo: "CUS-TEST-001",
        type: "COMPANY",
        email: "test@example.com",
        discount: 0,
      },
    } as Request;

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    const res = {
      status,
    } as unknown as Response;

    await createCustomer(req, res);

    expect(status).toHaveBeenCalledWith(400);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation failed",
      }),
    );

    // Bei ungültigen Daten darf kein Datenbankzugriff erfolgen
    expect(mockCustomerCreate).not.toHaveBeenCalled();
  });
});
