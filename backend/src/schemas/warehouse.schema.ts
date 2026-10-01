import { z } from "zod";

// Validierung für das Erstellen eines Lagers
export const createWarehouseSchema = z.object({
  code: z.string().trim().min(2).max(20),
  name: z.string().trim().min(2).max(100),
  address: z.string().trim().max(255).optional(),

  branchId: z.uuid(),
});

// Validierung für das Aktualisieren eines Lagers
export const updateWarehouseSchema = createWarehouseSchema
  .omit({
    branchId: true,
  })
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type CreateWarehouseInput = z.infer<
  typeof createWarehouseSchema
>;

export type UpdateWarehouseInput = z.infer<
  typeof updateWarehouseSchema
>;
