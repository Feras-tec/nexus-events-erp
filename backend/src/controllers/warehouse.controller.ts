import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import {
  createWarehouseSchema,
  updateWarehouseSchema,
} from "../schemas/warehouse.schema.js";

// Neues Lager erstellen
export const createWarehouse = async (req: Request, res: Response) => {
  const result = createWarehouseSchema.safeParse(req.body);

  // Ungültige Eingabedaten ablehnen
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    // Prüfen, ob die Niederlassung existiert und aktiv ist
    const branch = await prisma.branch.findUnique({
      where: {
        id: result.data.branchId,
      },
    });

    if (!branch) {
      return res.status(404).json({
        error: "Branch not found",
      });
    }

    if (!branch.isActive) {
      return res.status(400).json({
        error: "Branch is inactive",
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: result.data,
    });

    return res.status(201).json({
      data: warehouse,
    });
  } catch (error) {
    console.error("Create warehouse error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Alle Lager abrufen
export const getWarehouses = async (_req: Request, res: Response) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        branch: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      data: warehouses,
    });
  } catch (error) {
    console.error("Get warehouses error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Ein Lager anhand seiner ID abrufen
export const getWarehouseById = async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        branch: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!warehouse) {
      return res.status(404).json({
        error: "Warehouse not found",
      });
    }

    return res.status(200).json({
      data: warehouse,
    });
  } catch (error) {
    console.error("Get warehouse error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Daten eines Lagers teilweise aktualisieren
export const updateWarehouse = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const result = updateWarehouseSchema.safeParse(req.body);

  // Ungültige Eingabedaten ablehnen
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id },
    });

    if (!existingWarehouse) {
      return res.status(404).json({
        error: "Warehouse not found",
      });
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: result.data,
    });

    return res.status(200).json({
      data: warehouse,
    });
  } catch (error) {
    console.error("Update warehouse error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Lager deaktivieren, ohne historische Daten zu löschen
export const deactivateWarehouse = async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id },
    });

    if (!existingWarehouse) {
      return res.status(404).json({
        error: "Warehouse not found",
      });
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return res.status(200).json({
      message: "Warehouse deactivated successfully",
      data: warehouse,
    });
  } catch (error) {
    console.error("Deactivate warehouse error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
