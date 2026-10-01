import { z } from "zod";

// Mögliche Arten der Bestandsverfolgung
const productTrackingTypeSchema = z.enum([
  "SERIALIZED",
  "QUANTITY",
]);

// Mögliche Nutzungsarten eines Produkts
const productUsageTypeSchema = z.enum([
  "RENTAL",
  "SALE",
  "BOTH",
]);

// Validierung für das Erstellen eines Produkts
export const createProductSchema = z.object({
  productNo: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(150),
  brand: z.string().trim().max(100).optional(),
  model: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  description: z.string().trim().max(1000).optional(),

  trackingType: productTrackingTypeSchema.default("SERIALIZED"),
  usageType: productUsageTypeSchema.default("RENTAL"),
});

// Validierung für das Aktualisieren eines Produkts
export const updateProductSchema = createProductSchema
  .omit({
    productNo: true,
  })
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type CreateProductInput = z.infer<
  typeof createProductSchema
>;

export type UpdateProductInput = z.infer<
  typeof updateProductSchema
>;
