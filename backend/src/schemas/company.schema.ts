import { z } from "zod";

// Validierung für das Erstellen einer Firma
export const createCompanySchema = z.object({
  name: z.string().trim().min(2).max(100),

  legalName: z.string().trim().max(150).optional(),
  taxNumber: z.string().trim().max(50).optional(),
  vatId: z.string().trim().max(50).optional(),

  email: z.email().optional(),

  phone: z.string().trim().max(50).optional(),
  website: z.url().optional(),
  address: z.string().trim().max(255).optional(),
});

// TypeScript-Typ wird automatisch aus dem Zod-Schema erstellt
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

// Validierung für das Aktualisieren einer Firma
export const updateCompanySchema = createCompanySchema.partial().extend({
  isActive: z.boolean().optional(),
});

// TypeScript-Typ für Firmen-Updates
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
