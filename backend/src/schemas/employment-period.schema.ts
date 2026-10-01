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
