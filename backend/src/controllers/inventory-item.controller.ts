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

    const inventoryItem = await prisma.inventoryItem.create({
      data: result.data,
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

    const inventoryItem = await prisma.inventoryItem.update({
      where: {
        id,
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
    console.error("Update inventory item error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
