import { z } from "zod";

// Validierung für das Erstellen eines Beschäftigungszeitraums
export const createEmploymentPeriodSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    position: z.string().trim().max(100).optional(),
    reason: z.string().trim().max(255).optional(),
  })
  .refine(
    (data) => !data.endDate || data.endDate >= data.startDate,
    {
      message: "End date must not be before start date",
      path: ["endDate"],
    },
  );

export type CreateEmploymentPeriodInput = z.infer<
  typeof createEmploymentPeriodSchema
>;

/**
 * Validierung für die teilweise Aktualisierung
 * eines Beschäftigungszeitraums.
 *
 * Die Prüfung endDate >= startDate erfolgt zusätzlich
 * im Controller zusammen mit den bereits gespeicherten Daten.
 */
export const updateEmploymentPeriodSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  position: z.string().trim().max(100).nullable().optional(),
  reason: z.string().trim().max(255).nullable().optional(),
});

export type UpdateEmploymentPeriodInput = z.infer<
  typeof updateEmploymentPeriodSchema
>;

