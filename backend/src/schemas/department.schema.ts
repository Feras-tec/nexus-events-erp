import { z } from "zod";

// Validierung für das Erstellen einer Abteilung
export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(255).optional(),

  branchId: z.uuid(),
});

// Validierung für das Aktualisieren einer Abteilung
export const updateDepartmentSchema = createDepartmentSchema
  .omit({
    branchId: true,
  })
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type CreateDepartmentInput = z.infer<
  typeof createDepartmentSchema
>;

export type UpdateDepartmentInput = z.infer<
  typeof updateDepartmentSchema
>;
