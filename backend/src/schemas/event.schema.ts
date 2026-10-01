import { z } from "zod";

// Mögliche Statuswerte eines Events
const eventStatusSchema = z.enum([
  "INQUIRY",
  "QUOTED",
  "CONFIRMED",
  "PREPARING",
  "IN_PROGRESS",
  "COMPLETED",
  "INVOICED",
  "CLOSED",
]);

// Gemeinsame Felder für Event-Daten
const eventBaseSchema = z.object({
  eventNo: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(150),
  type: z.string().trim().max(100).optional(),
  location: z.string().trim().max(255).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: eventStatusSchema.default("INQUIRY"),
  description: z.string().trim().max(1000).optional(),
  customerId: z.uuid(),
});

// Validierung für das Erstellen eines Events
export const createEventSchema = eventBaseSchema.refine(
  (data) => data.endDate >= data.startDate,
  {
    message: "End date must not be before start date",
    path: ["endDate"],
  },
);

// Validierung für das Aktualisieren eines Events
export const updateEventSchema = eventBaseSchema
  .omit({
    eventNo: true,
    customerId: true,
  })
  .partial();

export type CreateEventInput = z.infer<
  typeof createEventSchema
>;

export type UpdateEventInput = z.infer<
  typeof updateEventSchema
>;
