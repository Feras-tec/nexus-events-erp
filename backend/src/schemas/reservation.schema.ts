import { z } from "zod";

// Mögliche Status einer Reservierung
const reservationStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
]);

// Validierung für das Erstellen einer Reservierung
export const createReservationSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    status: reservationStatusSchema.default("PENDING"),
    notes: z.string().trim().max(500).optional(),
    eventId: z.uuid(),
    inventoryItemId: z.uuid(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must not be before start date",
    path: ["endDate"],
  });

// Validierung für das Aktualisieren einer Reservierung
export const updateReservationSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: reservationStatusSchema.optional(),
  notes: z.string().trim().max(500).optional(),
});

export type CreateReservationInput = z.infer<
  typeof createReservationSchema
>;

export type UpdateReservationInput = z.infer<
  typeof updateReservationSchema
>;
