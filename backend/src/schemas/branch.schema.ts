import { z } from "zod";

// Validierung für das Erstellen einer Niederlassung
export const createBranchSchema = z.object({
  code: z.string().trim().min(2).max(20),
  name: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),

  address: z.string().trim().max(255).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z.email().optional(),

  companyId: z.uuid(),
});

// Validierung für das Aktualisieren einer Niederlassung
export const updateBranchSchema = createBranchSchema
  .omit({
    companyId: true,
  })
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
