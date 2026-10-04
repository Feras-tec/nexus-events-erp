import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { createEquipmentMovementSchema } from "../schemas/equipment-movement.schema.js";
import {
  isEquipmentStatusTransitionAllowed,
  isEquipmentMovementTypeValid,
} from "../utils/equipment-status-transition.js";
import { getAuth } from "@clerk/express";
import { createAuditLog } from "../services/audit-log.service.js";

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

    const {
      type,
      toStatus,
      toLocation,
      toWarehouseId,
      notes,
      reservationId,
      responsibleEmployeeId,
    } = result.data;

    // Zugehörige Reservierung prüfen
    if (reservationId) {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        return res.status(404).json({
          error: "Reservation not found",
        });
      }

      if (reservation.inventoryItemId !== inventoryItemId) {
        return res.status(409).json({
          error: "Reservation does not belong to this inventory item",
        });
      }

      if (reservation.status === "CANCELLED") {
        return res.status(409).json({
          error: "Cancelled reservation cannot be used for equipment movement",
        });
      }

      // Dieselbe Reservierung darf den Geräte-Workflow nur einmal starten
      if (type === "RESERVED") {
        const existingReservedMovement =
          await prisma.equipmentMovement.findFirst({
            where: {
              inventoryItemId,
              reservationId,
              type: "RESERVED",
            },
            select: {
              id: true,
            },
          });

        if (existingReservedMovement) {
          return res.status(409).json({
            error: "Equipment workflow already started for this reservation",
          });
        }
      }
    }

    // Verantwortlichen Mitarbeiter prüfen
    if (responsibleEmployeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: responsibleEmployeeId },
      });

      if (!employee) {
        return res.status(404).json({
          error: "Responsible employee not found",
        });
      }

      if (employee.status !== "ACTIVE") {
        return res.status(409).json({
          error: "Responsible employee is not active",
        });
      }
    }

    // Internen Lagertransfer prüfen
    if (type === "TRANSFERRED") {
      if (toStatus !== inventoryItem.status) {
        return res.status(409).json({
          error: "Warehouse transfer cannot change equipment status",
          currentStatus: inventoryItem.status,
          requestedStatus: toStatus,
        });
      }

      if (!toWarehouseId) {
        return res.status(400).json({
          error: "Target warehouse is required for transfer",
        });
      }

      const targetWarehouse = await prisma.warehouse.findUnique({
        where: { id: toWarehouseId },
      });

      if (!targetWarehouse) {
        return res.status(404).json({
          error: "Target warehouse not found",
        });
      }

      if (!targetWarehouse.isActive) {
        return res.status(409).json({
          error: "Target warehouse is inactive",
        });
      }

      if (inventoryItem.warehouseId === toWarehouseId) {
        return res.status(409).json({
          error: "Equipment is already in the target warehouse",
        });
      }
    }

    // Prüfen, ob der Statusübergang erlaubt ist
    if (
      type !== "MANUAL_ADJUSTMENT" &&
      type !== "TRANSFERRED" &&
      !isEquipmentStatusTransitionAllowed(inventoryItem.status, toStatus)
    ) {
      return res.status(409).json({
        error: "Invalid equipment status transition",
        fromStatus: inventoryItem.status,
        toStatus,
      });
    }

    // Prüfen, ob der Bewegungstyp zum Statusübergang passt
    if (
      !isEquipmentMovementTypeValid(
        inventoryItem.status,
        type,
        toStatus,
      )
    ) {
      return res.status(409).json({
        error: "Movement type does not match equipment status transition",
        movementType: type,
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
          reservationId,
          responsibleEmployeeId,
        },
      });

      await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: {
          status: toStatus,
          ...(toLocation !== undefined ? { location: toLocation } : {}),
          ...(type === "TRANSFERRED" && toWarehouseId
            ? { warehouseId: toWarehouseId }
            : {}),
        },
      });

      return createdMovement;
    });
    // Wichtige Gerätebewegung im Audit-Log speichern
    const { userId } = getAuth(req);

    await createAuditLog({
      ...(userId ? { userId } : {}),
      action: "EQUIPMENT_MOVEMENT_CREATED",
      entityType: "InventoryItem",
      entityId: inventoryItemId,
      details: {
        movementId: movement.id,
        type,
        fromStatus: inventoryItem.status,
        toStatus,
        fromLocation: inventoryItem.location,
        toLocation,
      },
      ...(req.ip ? { ipAddress: req.ip } : {}),
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
      include: {
        reservation: {
          include: {
            event: {
              include: {
                customer: true,
              },
            },
          },
        },
        responsibleEmployee: true,
      },
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
