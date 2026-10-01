import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../schemas/customer.schema.js";

// Neuen Kunden erstellen
export const createCustomer = async (
  req: Request,
  res: Response,
) => {
  const result = createCustomerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    const customer = await prisma.customer.create({
      data: result.data,
    });

    return res.status(201).json({
      data: customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Alle Kunden abrufen
export const getCustomers = async (
  _req: Request,
  res: Response,
) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      data: customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Einen Kunden anhand seiner ID abrufen
export const getCustomerById = async (
  req: Request,
  res: Response,
) => {
  const id = String(req.params.id);

  try {
    const customer = await prisma.customer.findUnique({
      where: {
        id,
      },
    });

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    return res.status(200).json({
      data: customer,
    });
  } catch (error) {
    console.error("Get customer error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Kundendaten teilweise aktualisieren
export const updateCustomer = async (
  req: Request,
  res: Response,
) => {
  const id = String(req.params.id);
  const result = updateCustomerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id,
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    const customer = await prisma.customer.update({
      where: {
        id,
      },
      data: result.data,
    });

    return res.status(200).json({
      data: customer,
    });
  } catch (error) {
    console.error("Update customer error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Kunden deaktivieren statt endgültig löschen
export const deactivateCustomer = async (
  req: Request,
  res: Response,
) => {
  const id = String(req.params.id);

  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id,
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    const customer = await prisma.customer.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });

    return res.status(200).json({
      data: customer,
    });
  } catch (error) {
    console.error("Deactivate customer error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
