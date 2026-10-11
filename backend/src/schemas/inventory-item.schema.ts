import { z } from "zod";

// Mögliche Statuswerte eines Lagerartikels
const inventoryItemStatusSchema = z.enum([
  "PENDING_REGISTRATION",
  "RECEIVED",
  "AVAILABLE",
  "RESERVED",
  "PICKING",
  "PACKED",
  "IN_TRANSIT",
  "AT_EVENT",
  "RETURNING",
  "INSPECTION",
  "DAMAGED",
  "MAINTENANCE",
  "REPAIRED",
  "LOST",
  "RETIRED",
]);

// Validierung für das Erstellen eines Lagerartikels
export const createInventoryItemSchema = z.object({
  assetNo: z.string().trim().min(2).max(30),
  manufacturerSerial: z.string().trim().max(100).optional(),
  barcode: z.string().trim().max(100).optional(),
  status: inventoryItemStatusSchema.default("PENDING_REGISTRATION"),
  location: z.string().trim().max(150).optional(),
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  notes: z.string().trim().max(500).optional(),

  productId: z.uuid(),
  warehouseId: z.uuid(),
});

// Validierung für das Aktualisieren eines Lagerartikels
export const updateInventoryItemSchema = createInventoryItemSchema
  .omit({
    assetNo: true,
    productId: true,
  })
  .partial();

export type CreateInventoryItemInput = z.infer<
  typeof createInventoryItemSchema
>;

export type UpdateInventoryItemInput = z.infer<
  typeof updateInventoryItemSchema
>;

// Validierung für die automatische Erstellung mehrerer Lagerartikel
export const bulkGenerateInventoryItemsSchema = z.object({
  productId: z.uuid(),
  warehouseId: z.uuid(),
  quantity: z.number().int().min(1).max(1000),
  // Eindeutiger Schlüssel für wiederholbare Generierungsanfragen
  idempotencyKey: z.uuid(),
});

// Datentyp für die automatische Erstellung mehrerer Lagerartikel
export type BulkGenerateInventoryItemsInput = z.infer<
  typeof bulkGenerateInventoryItemsSchema
>;

// Validierung eines Barcode-Scans beim Wareneingang
export const scanReceiveInventoryItemSchema = z.object({
  barcode: z.string().trim().min(1).max(100),
  responsibleEmployeeId: z.uuid().optional(),
});
