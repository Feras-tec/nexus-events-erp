import type { Request, Response } from "express";
import { jest } from "@jest/globals";

const mockCustomerCreate = jest.fn<
  () => Promise<{
    id: string;
    customerNo: string;
    type: "COMPANY";
    companyName: string;
    email: string;
    discount: number;
    isActive: boolean;
  }>
>();

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: {
    customer: {
      create: mockCustomerCreate,
    },
  },
}));

const { createCustomer } =
  await import("../src/controllers/customer.controller.js");

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
  it("sollte einen gültigen Firmenkunden erstellen", async () => {
    const customerData = {
      customerNo: "CUS-TEST-002",
      type: "COMPANY" as const,
      companyName: "Test Event GmbH",
      email: "info@test-event.de",
      discount: 5,
    };

    const createdCustomer = {
      id: "customer-test-id",
      ...customerData,
      isActive: true,
    };

    mockCustomerCreate.mockResolvedValue(createdCustomer);

    const req = {
      body: customerData,
    } as Request;

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    const res = {
      status,
    } as unknown as Response;

    await createCustomer(req, res);

    expect(mockCustomerCreate).toHaveBeenCalledWith({
      data: customerData,
    });

    expect(status).toHaveBeenCalledWith(201);

    expect(json).toHaveBeenCalledWith({
      data: createdCustomer,
    });
  });
});
