import { z } from "zod";

// Mögliche Statuswerte eines Lagerartikels
const inventoryItemStatusSchema = z.enum([
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
  status: inventoryItemStatusSchema.default("AVAILABLE"),
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
