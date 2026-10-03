import { z } from "zod";

// Erlaubte Dokumenttypen für Mitarbeiter
const employeeDocumentTypeSchema = z.enum([
  "RESIDENCE_PERMIT",
  "WORK_PERMIT",
  "PASSPORT",
  "CONTRACT",
  "OTHER",
]);

// Validierung für das Erstellen eines Mitarbeiterdokuments
export const createEmployeeDocumentSchema = z
  .object({
    type: employeeDocumentTypeSchema,
    documentNumber: z.string().trim().max(100).optional(),
    issueDate: z.coerce.date().optional(),
    expiryDate: z.coerce.date().optional(),
    fileUrl: z.url().optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine(
    (data) =>
      !data.issueDate ||
      !data.expiryDate ||
      data.expiryDate >= data.issueDate,
    {
      message: "Expiry date must not be before issue date",
      path: ["expiryDate"],
    },
  );

export type CreateEmployeeDocumentInput = z.infer<
  typeof createEmployeeDocumentSchema
>;

// Validierung für die teilweise Aktualisierung eines Mitarbeiterdokuments
export const updateEmployeeDocumentSchema = z.object({
  type: employeeDocumentTypeSchema.optional(),
  documentNumber: z.string().trim().max(100).nullable().optional(),
  issueDate: z.coerce.date().nullable().optional(),
  expiryDate: z.coerce.date().nullable().optional(),
  fileUrl: z.url().nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export type UpdateEmployeeDocumentInput = z.infer<
  typeof updateEmployeeDocumentSchema
>;
