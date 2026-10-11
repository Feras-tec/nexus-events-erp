import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
} from "../schemas/inventory-item.schema.js";

// Neuen Lagerartikel erstellen
export const createInventoryItem = async (req: Request, res: Response) => {
  const result = createInventoryItemSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    // Prüfen, ob das Produkt existiert und aktiv ist
    const product = await prisma.product.findUnique({
      where: {
        id: result.data.productId,
      },
    });

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        error: "Product is inactive",
      });
    }

    // Prüfen, ob das Lager existiert und aktiv ist
    const warehouse = await prisma.warehouse.findUnique({
      where: {
        id: result.data.warehouseId,
      },
    });

    if (!warehouse) {
      return res.status(404).json({
        error: "Warehouse not found",
      });
    }

    if (!warehouse.isActive) {
      return res.status(400).json({
        error: "Warehouse is inactive",
      });
    }

    // Neue Artikel dürfen nicht ohne Barcode-Scan verfügbar werden
    if (result.data.status !== "PENDING_REGISTRATION") {
      return res.status(409).json({
        error: "New inventory items must start as pending registration",
      });
    }

    // Inventarnummer als Barcode verwenden, falls keiner angegeben wurde
    const barcode = result.data.barcode?.trim() || result.data.assetNo;

    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        ...result.data,
        barcode,
        status: "PENDING_REGISTRATION",
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    return res.status(201).json({
      data: inventoryItem,
    });
  } catch (error) {
    console.error("Create inventory item error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
// Alle Lagerartikel abrufen
export const getInventoryItems = async (_req: Request, res: Response) => {
  try {
    const inventoryItems = await prisma.inventoryItem.findMany({
      include: {
        product: true,
        warehouse: {
          include: {
            branch: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      data: inventoryItems,
    });
  } catch (error) {
    console.error("Get inventory items error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Einen Lagerartikel anhand seiner ID abrufen
export const getInventoryItemById = async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: {
        id,
      },
      include: {
        product: true,
        warehouse: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!inventoryItem) {
      return res.status(404).json({
        error: "Inventory item not found",
      });
    }

    return res.status(200).json({
      data: inventoryItem,
    });
  } catch (error) {
    console.error("Get inventory item error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
// Lagerartikel teilweise aktualisieren
export const updateInventoryItem = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const result = updateInventoryItemSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    const existingItem = await prisma.inventoryItem.findUnique({
      where: {
        id,
      },
    });

    if (!existingItem) {
      return res.status(404).json({
        error: "Inventory item not found",
      });
    }

    // Nicht registrierte Artikel dürfen nicht manuell freigegeben werden
    if (
      existingItem.status === "PENDING_REGISTRATION" &&
      result.data.status &&
      result.data.status !== "PENDING_REGISTRATION"
    ) {
      return res.status(409).json({
        error: "Pending inventory items must be received by barcode scan",
      });
    }

    // Der Registrierungsstatus darf nicht manuell gesetzt werden
    if (
      result.data.status === "PENDING_REGISTRATION" &&
      existingItem.status !== "PENDING_REGISTRATION"
    ) {
      return res.status(409).json({
        error: "Pending registration cannot be assigned manually",
      });
    }

    // Neues Lager prüfen, falls der Artikel verschoben wird
    if (result.data.warehouseId) {
      const warehouse = await prisma.warehouse.findUnique({
        where: {
          id: result.data.warehouseId,
        },
      });

      if (!warehouse) {
        return res.status(404).json({
          error: "Warehouse not found",
        });
      }

      if (!warehouse.isActive) {
        return res.status(400).json({
          error: "Warehouse is inactive",
        });
      }
    }

    // Aktualisierung nur bei unverändertem Status durchführen
    const inventoryItem = await prisma.inventoryItem.update({
      where: {
        id,
        status: existingItem.status,
      },
      data: result.data,
      include: {
        product: true,
        warehouse: true,
      },
    });

    return res.status(200).json({
      data: inventoryItem,
    });
  } catch (error) {
    // Gleichzeitige Statusänderungen verhindern veraltete Updates
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return res.status(409).json({
        error: "Inventory item was modified concurrently or no longer exists",
      });
    }

    console.error("Update inventory item error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
