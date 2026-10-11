import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import prisma from "../lib/prisma.js";
import { createAuditLog } from "../services/audit-log.service.js";
import {
  bulkGenerateInventoryItemsSchema,
  scanReceiveInventoryItemSchema,
} from "../schemas/inventory-item.schema.js";

// Eindeutige Inventarnummer mit kryptografisch sicherem Zufallswert erzeugen
function generateAssetNo(): string {
  return `NX-${randomBytes(12).toString("hex").toUpperCase()}`;
}

// Mehrere Lagerartikel idempotent als nicht registriert anlegen
export async function bulkGenerateInventoryItems(req: Request, res: Response) {
  const result = bulkGenerateInventoryItemsSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  const { productId, warehouseId, quantity, idempotencyKey } = result.data;

  try {
    // Vorhandene Charge mit identischen Parametern wiederverwenden
    const existing = await prisma.barcodeBatch.findUnique({
      where: { idempotencyKey },
      include: { inventoryItems: { orderBy: { assetNo: "asc" } } },
    });

    if (existing) {
      if (
        existing.productId !== productId ||
        existing.warehouseId !== warehouseId ||
        existing.quantity !== quantity
      ) {
        return res.status(409).json({
          error: "Idempotency key already used with different parameters",
        });
      }

      return res.status(200).json({
        batchId: existing.id,
        data: existing.inventoryItems,
        count: existing.inventoryItems.length,
        reused: true,
      });
    }

    // Produkt und Lager vor der Erstellung prüfen
    const [product, warehouse] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.warehouse.findUnique({ where: { id: warehouseId } }),
    ]);

    if (!product || !product.isActive) {
      return res.status(400).json({
        error: "Product not found or inactive",
      });
    }

    if (!warehouse || !warehouse.isActive) {
      return res.status(400).json({
        error: "Warehouse not found or inactive",
      });
    }

    if (product.trackingType !== "SERIALIZED") {
      return res.status(400).json({
        error: "Bulk barcode generation requires a serialized product",
      });
    }

    // Charge und Inventarartikel gemeinsam atomar speichern
    const batch = await prisma.$transaction(async (tx) => {
      const created = await tx.barcodeBatch.create({
        data: { idempotencyKey, productId, warehouseId, quantity },
      });

      const data = Array.from({ length: quantity }, () => {
        const assetNo = generateAssetNo();

        return {
          assetNo,
          barcode: assetNo,
          productId,
          warehouseId,
          barcodeBatchId: created.id,
          status: "PENDING_REGISTRATION" as const,
        };
      });

      await tx.inventoryItem.createMany({ data });

      return tx.barcodeBatch.findUniqueOrThrow({
        where: { id: created.id },
        include: { inventoryItems: { orderBy: { assetNo: "asc" } } },
      });
    });

    // Erfolgreiche Erstellung zusätzlich protokollieren
    const { userId } = getAuth(req);

    await createAuditLog({
      ...(userId ? { userId } : {}),
      action: "INVENTORY_BARCODES_BULK_GENERATED",
      entityType: "BarcodeBatch",
      entityId: batch.id,
      details: {
        productId,
        warehouseId,
        quantity,
        assetNumbers: batch.inventoryItems.map((item) => item.assetNo),
      },
      ...(req.ip ? { ipAddress: req.ip } : {}),
    });

    return res.status(201).json({
      batchId: batch.id,
      data: batch.inventoryItems,
      count: batch.inventoryItems.length,
      reused: false,
    });
  } catch (error) {
    // Bei gleichzeitigen Anfragen gewinnt nur eine Transaktion
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      const existing = await prisma.barcodeBatch.findUnique({
        where: { idempotencyKey },
        include: { inventoryItems: { orderBy: { assetNo: "asc" } } },
      });

      if (existing) {
        if (
          existing.productId !== productId ||
          existing.warehouseId !== warehouseId ||
          existing.quantity !== quantity
        ) {
          return res.status(409).json({
            error: "Idempotency key already used with different parameters",
          });
        }

        return res.status(200).json({
          batchId: existing.id,
          data: existing.inventoryItems,
          count: existing.inventoryItems.length,
          reused: true,
        });
      }
    }

    console.error("Bulk barcode generation error:", error);

    return res.status(500).json({
      error: "Could not generate inventory barcodes",
    });
  }
}

// Barcode-Scan beim Wareneingang atomar verarbeiten
export async function scanReceiveInventoryItem(req: Request, res: Response) {
  const result = scanReceiveInventoryItemSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  const { barcode, responsibleEmployeeId } = result.data;

  try {
    // Verantwortlichen Mitarbeiter prüfen, sofern angegeben
    if (responsibleEmployeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: responsibleEmployeeId },
      });

      if (!employee || employee.status !== "ACTIVE") {
        return res.status(409).json({
          error: "Responsible employee not found or inactive",
        });
      }
    }

    // Lagerartikel anhand des Barcodes suchen
    const item = await prisma.inventoryItem.findUnique({
      where: { barcode },
    });

    if (!item) {
      return res.status(404).json({
        error: "Barcode not found",
      });
    }

    // Statusänderung und Wareneingang gemeinsam speichern
    const received = await prisma.$transaction(async (tx) => {
      const updated = await tx.inventoryItem.updateMany({
        where: {
          id: item.id,
          status: "PENDING_REGISTRATION",
        },
        data: {
          status: "AVAILABLE",
        },
      });

      // Ein bereits registrierter Artikel darf nicht erneut gezählt werden
      if (updated.count !== 1) {
        return false;
      }

      await tx.equipmentMovement.create({
        data: {
          type: "RECEIVED",
          fromStatus: "PENDING_REGISTRATION",
          toStatus: "AVAILABLE",
          inventoryItemId: item.id,
          toWarehouseId: item.warehouseId,
          responsibleEmployeeId,
          notes: "Barcode-Wareneingang",
        },
      });

      return true;
    });

    if (!received) {
      return res.status(409).json({
        error: "Inventory item already registered or not pending",
        assetNo: item.assetNo,
      });
    }

    // Angemeldeten Benutzer zusätzlich im Audit-Log dokumentieren
    const { userId } = getAuth(req);

    await createAuditLog({
      ...(userId ? { userId } : {}),
      action: "INVENTORY_BARCODE_RECEIVED",
      entityType: "InventoryItem",
      entityId: item.id,
      details: {
        barcode,
        warehouseId: item.warehouseId,
        responsibleEmployeeId,
      },
      ...(req.ip ? { ipAddress: req.ip } : {}),
    });

    return res.status(200).json({
      success: true,
      message: "Inventory item received successfully",
      data: {
        id: item.id,
        assetNo: item.assetNo,
        barcode,
        status: "AVAILABLE",
      },
    });
  } catch (error) {
    console.error("Barcode receiving error:", error);

    return res.status(500).json({
      error: "Could not receive inventory item",
    });
  }
}
