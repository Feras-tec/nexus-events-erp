import { z } from "zod";

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

const equipmentMovementTypeSchema = z.enum([
  "RECEIVED",
  "RESERVED",
  "PICKED",
  "PACKED",
  "LOADED",
  "TRANSFERRED",
  "DELIVERED_TO_EVENT",
  "RETURNED_FROM_EVENT",
  "INSPECTION",
  "MAINTENANCE",
  "REPAIRED",
  "LOST",
  "RETIRED",
  "MANUAL_ADJUSTMENT",
]);

export const createEquipmentMovementSchema = z.object({
  type: equipmentMovementTypeSchema,
  toStatus: inventoryItemStatusSchema,
  toLocation: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type CreateEquipmentMovementInput = z.infer<
  typeof createEquipmentMovementSchema
>;
