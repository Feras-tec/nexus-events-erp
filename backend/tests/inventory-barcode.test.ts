import type { Request, Response } from "express";
import { jest } from "@jest/globals";

// Datenbankzugriffe für sichere Tests simulieren
const mockBatchFindUnique = jest.fn();
const mockTransaction = jest.fn();
const mockInventoryItemFindUnique = jest.fn();
const mockInventoryItemUpdateMany = jest.fn();
const mockEquipmentMovementCreate = jest.fn();
const mockProductFindUnique = jest.fn();
const mockWarehouseFindUnique = jest.fn();
const mockBatchCreate = jest.fn();
const mockBatchFindUniqueOrThrow = jest.fn();
const mockInventoryItemCreateMany = jest.fn();

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: {
    barcodeBatch: {
      findUnique: mockBatchFindUnique,
    },
    product: {
      findUnique: mockProductFindUnique,
    },
    warehouse: {
      findUnique: mockWarehouseFindUnique,
    },
    inventoryItem: {
      findUnique: mockInventoryItemFindUnique,
    },
    $transaction: mockTransaction,
  },
}));

// Authentifizierung und Audit-Log ohne externe Dienste simulieren
jest.unstable_mockModule("@clerk/express", () => ({
  getAuth: jest.fn(() => ({ userId: "test-user" })),
}));

jest.unstable_mockModule("../src/services/audit-log.service.js", () => ({
  createAuditLog: jest.fn(),
}));

const { bulkGenerateInventoryItems, scanReceiveInventoryItem } =
  await import("../src/controllers/inventory-barcode.controller.js");

describe("Inventory Barcode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sollte eine bestehende Barcode-Charge wiederverwenden", async () => {
    const productId = "11111111-1111-4111-8111-111111111111";
    const warehouseId = "22222222-2222-4222-8222-222222222222";
    const idempotencyKey = "33333333-3333-4333-8333-333333333333";

    // Bereits erzeugte Charge aus der simulierten Datenbank
    const existingBatch = {
      id: "44444444-4444-4444-8444-444444444444",
      productId,
      warehouseId,
      quantity: 2,
      inventoryItems: [
        { assetNo: "NX-001", status: "PENDING_REGISTRATION" },
        { assetNo: "NX-002", status: "PENDING_REGISTRATION" },
      ],
    };

    mockBatchFindUnique.mockResolvedValue(existingBatch as never);

    const req = {
      body: { productId, warehouseId, quantity: 2, idempotencyKey },
    } as Request;

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status } as unknown as Response;

    await bulkGenerateInventoryItems(req, res);

    expect(mockBatchFindUnique).toHaveBeenCalledWith({
      where: { idempotencyKey },
      include: {
        inventoryItems: { orderBy: { assetNo: "asc" } },
      },
    });

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      batchId: existingBatch.id,
      data: existingBatch.inventoryItems,
      count: 2,
      reused: true,
    });

    // Bei einer Wiederholung dürfen keine neuen Artikel entstehen
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("sollte denselben Idempotency-Key mit anderen Parametern ablehnen", async () => {
    const productId = "11111111-1111-4111-8111-111111111111";
    const warehouseId = "22222222-2222-4222-8222-222222222222";
    const idempotencyKey = "33333333-3333-4333-8333-333333333333";

    // Die gespeicherte Charge enthält ursprünglich 100 Artikel
    mockBatchFindUnique.mockResolvedValue({
      id: "44444444-4444-4444-8444-444444444444",
      productId,
      warehouseId,
      quantity: 100,
      inventoryItems: [],
    } as never);

    // Der neue Antrag verlangt 200 Artikel mit demselben Schlüssel
    const req = {
      body: {
        productId,
        warehouseId,
        quantity: 200,
        idempotencyKey,
      },
    } as Request;

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status } as unknown as Response;

    await bulkGenerateInventoryItems(req, res);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      error: "Idempotency key already used with different parameters",
    });

    // Ein Konflikt darf keine neue Datenbanktransaktion starten
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("sollte einen neuen Lagerartikel per Barcode registrieren", async () => {
    const barcode = "NX-TEST-001";
    const item = {
      id: "55555555-5555-4555-8555-555555555555",
      assetNo: barcode,
      barcode,
      warehouseId: "22222222-2222-4222-8222-222222222222",
      status: "PENDING_REGISTRATION",
    };

    // Noch nicht registrierten Lagerartikel simulieren
    mockInventoryItemFindUnique.mockResolvedValue(item as never);
    mockInventoryItemUpdateMany.mockResolvedValue({ count: 1 } as never);
    mockEquipmentMovementCreate.mockResolvedValue({ id: "movement-1" } as never);

    // Transaktion mit simulierten Datenbankoperationen ausführen
    mockTransaction.mockImplementation(async (callback: any) =>
      callback({
        inventoryItem: {
          updateMany: mockInventoryItemUpdateMany,
        },
        equipmentMovement: {
          create: mockEquipmentMovementCreate,
        },
      })
    );

    const req = {
      body: { barcode },
    } as Request;

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status } as unknown as Response;

    await scanReceiveInventoryItem(req, res);

    expect(mockInventoryItemUpdateMany).toHaveBeenCalledWith({
      where: {
        id: item.id,
        status: "PENDING_REGISTRATION",
      },
      data: {
        status: "AVAILABLE",
      },
    });

    expect(mockEquipmentMovementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "RECEIVED",
        fromStatus: "PENDING_REGISTRATION",
        toStatus: "AVAILABLE",
        inventoryItemId: item.id,
        toWarehouseId: item.warehouseId,
      }),
    });

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          barcode,
          status: "AVAILABLE",
        }),
      })
    );
  });

  it("sollte eine doppelte Barcode-Registrierung ablehnen", async () => {
    const barcode = "NX-TEST-002";
    const item = {
      id: "66666666-6666-4666-8666-666666666666",
      assetNo: barcode,
      barcode,
      warehouseId: "22222222-2222-4222-8222-222222222222",
      status: "AVAILABLE",
    };

    // Bereits registrierten Lagerartikel simulieren
    mockInventoryItemFindUnique.mockResolvedValue(item as never);

    // Kein Datensatz erfüllt mehr die Bedingung PENDING_REGISTRATION
    mockInventoryItemUpdateMany.mockResolvedValue({ count: 0 } as never);

    mockTransaction.mockImplementation(async (callback: any) =>
      callback({
        inventoryItem: {
          updateMany: mockInventoryItemUpdateMany,
        },
        equipmentMovement: {
          create: mockEquipmentMovementCreate,
        },
      })
    );

    const req = {
      body: { barcode },
    } as Request;

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status } as unknown as Response;

    await scanReceiveInventoryItem(req, res);

    expect(mockInventoryItemUpdateMany).toHaveBeenCalledWith({
      where: {
        id: item.id,
        status: "PENDING_REGISTRATION",
      },
      data: {
        status: "AVAILABLE",
      },
    });

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      error: "Inventory item already registered or not pending",
      assetNo: item.assetNo,
    });

    // Ein zweiter Scan darf keine weitere Lagerbewegung erzeugen
    expect(mockEquipmentMovementCreate).not.toHaveBeenCalled();
  });

  it("sollte einen unbekannten Barcode ablehnen", async () => {
    const barcode = "NX-UNKNOWN-001";

    // Der Barcode existiert nicht in der Datenbank
    mockInventoryItemFindUnique.mockResolvedValue(null as never);

    const req = {
      body: { barcode },
    } as Request;

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status } as unknown as Response;

    await scanReceiveInventoryItem(req, res);

    expect(mockInventoryItemFindUnique).toHaveBeenCalledWith({
      where: { barcode },
    });

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      error: "Barcode not found",
    });

    // Unbekannte Barcodes dürfen keine Lageränderung auslösen
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockEquipmentMovementCreate).not.toHaveBeenCalled();
  });

  it("sollte 100 eindeutige Barcodes als nicht registriert erzeugen", async () => {
    const productId = "11111111-1111-4111-8111-111111111111";
    const warehouseId = "22222222-2222-4222-8222-222222222222";
    const idempotencyKey = "33333333-3333-4333-8333-333333333333";
    const batchId = "44444444-4444-4444-8444-444444444444";

    // Eine neue Charge ohne vorhandenen Idempotency-Key simulieren
    mockBatchFindUnique.mockResolvedValue(null as never);
    mockProductFindUnique.mockResolvedValue({
      id: productId,
      isActive: true,
      trackingType: "SERIALIZED",
    } as never);
    mockWarehouseFindUnique.mockResolvedValue({
      id: warehouseId,
      isActive: true,
    } as never);
    mockBatchCreate.mockResolvedValue({ id: batchId } as never);

    let generatedItems: Array<{
      assetNo: string;
      barcode: string;
      productId: string;
      warehouseId: string;
      barcodeBatchId: string;
      status: string;
    }> = [];

    // Die erzeugten Artikel ohne echte Datenbank speichern
    mockInventoryItemCreateMany.mockImplementation(async (args: any) => {
      generatedItems = args.data;
      return { count: generatedItems.length };
    });

    mockBatchFindUniqueOrThrow.mockImplementation(async () => ({
      id: batchId,
      inventoryItems: generatedItems,
    }));

    mockTransaction.mockImplementation(async (callback: any) =>
      callback({
        barcodeBatch: {
          create: mockBatchCreate,
          findUniqueOrThrow: mockBatchFindUniqueOrThrow,
        },
        inventoryItem: {
          createMany: mockInventoryItemCreateMany,
        },
      })
    );

    const req = {
      body: {
        productId,
        warehouseId,
        quantity: 100,
        idempotencyKey,
      },
    } as Request;

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status } as unknown as Response;

    await bulkGenerateInventoryItems(req, res);

    expect(status).toHaveBeenCalledWith(201);
    expect(mockBatchCreate).toHaveBeenCalledTimes(1);
    expect(mockInventoryItemCreateMany).toHaveBeenCalledTimes(1);
    expect(generatedItems).toHaveLength(100);

    // Jeder Artikel benötigt einen eindeutigen Barcode
    const barcodes = generatedItems.map((item) => item.barcode);
    expect(new Set(barcodes).size).toBe(100);

    // Vor dem Wareneingang darf kein Artikel verfügbar sein
    for (const item of generatedItems) {
      expect(item.status).toBe("PENDING_REGISTRATION");
      expect(item.assetNo).toBe(item.barcode);
      expect(item.productId).toBe(productId);
      expect(item.warehouseId).toBe(warehouseId);
      expect(item.barcodeBatchId).toBe(batchId);
    }

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        batchId,
        count: 100,
        reused: false,
      })
    );
  });

  it("sollte eine Generierungsanfrage ohne Idempotency-Key ablehnen", async () => {
    const req = {
      body: {
        productId: "11111111-1111-4111-8111-111111111111",
        warehouseId: "22222222-2222-4222-8222-222222222222",
        quantity: 500,
      },
    } as Request;

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    const res = { status } as unknown as Response;

    await bulkGenerateInventoryItems(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(mockBatchFindUnique).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
