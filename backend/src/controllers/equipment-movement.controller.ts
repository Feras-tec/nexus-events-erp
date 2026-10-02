import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { createEquipmentMovementSchema } from "../schemas/equipment-movement.schema.js";
import { isEquipmentStatusTransitionAllowed } from "../utils/equipment-status-transition.js";

// Neue Bewegung erstellen und aktuellen Gerätestatus aktualisieren
export async function createEquipmentMovement(req: Request, res: Response) {
  try {
    const inventoryItemId = req.params.inventoryItemId;

    if (typeof inventoryItemId !== "string") {
      return res.status(400).json({
        error: "Invalid inventory item ID",
      });
    }

    const result = createEquipmentMovementSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid movement data",
        details: result.error.flatten(),
      });
    }

    // Aktuellen Zustand des Geräts laden
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!inventoryItem) {
      return res.status(404).json({
        error: "Inventory item not found",
      });
    }

    const { type, toStatus, toLocation, notes } = result.data;

    // Prüfen, ob der Statusübergang erlaubt ist
    if (
      type !== "MANUAL_ADJUSTMENT" &&
      !isEquipmentStatusTransitionAllowed(inventoryItem.status, toStatus)
    ) {
      return res.status(409).json({
        error: "Invalid equipment status transition",
        fromStatus: inventoryItem.status,
        toStatus,
      });
    }

    // Bewegung und Statusänderung gemeinsam speichern
    const movement = await prisma.$transaction(async (tx) => {
      const createdMovement = await tx.equipmentMovement.create({
        data: {
          type,
          fromStatus: inventoryItem.status,
          toStatus,
          fromLocation: inventoryItem.location,
          toLocation,
          notes,
          inventoryItemId,
        },
      });

      await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: {
          status: toStatus,
          ...(toLocation !== undefined ? { location: toLocation } : {}),
        },
      });

      return createdMovement;
    });

    return res.status(201).json(movement);
  } catch (error) {
    console.error("Create equipment movement error:", error);

    return res.status(500).json({
      error: "Failed to create equipment movement",
    });
  }
}

// Bewegungshistorie eines Geräts abrufen
export async function getEquipmentMovements(req: Request, res: Response) {
  try {
    const inventoryItemId = req.params.inventoryItemId;

    if (typeof inventoryItemId !== "string") {
      return res.status(400).json({
        error: "Invalid inventory item ID",
      });
    }

    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
      select: {
        id: true,
        assetNo: true,
      },
    });

    if (!inventoryItem) {
      return res.status(404).json({
        error: "Inventory item not found",
      });
    }

    const movements = await prisma.equipmentMovement.findMany({
      where: { inventoryItemId },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      inventoryItem,
      movements,
    });
  } catch (error) {
    console.error("Get equipment movements error:", error);

    return res.status(500).json({
      error: "Failed to get equipment movements",
    });
  }
}
