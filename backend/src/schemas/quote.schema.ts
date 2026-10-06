import { z } from "zod";

const quoteStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
]);

const quoteItemTypeSchema = z.enum([
  "EQUIPMENT",
  "SERVICE",
  "TRANSPORT",
  "PERSONNEL",
  "OTHER",
]);

const quoteItemSchema = z.object({
  type: quoteItemTypeSchema,
  description: z.string().trim().min(1).max(500),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  discount: z.coerce.number().min(0).max(100).default(0),
  productId: z.uuid().optional(),
});

export const createQuoteSchema = z.object({
  quoteNo: z.string().trim().min(1).max(50),
  status: quoteStatusSchema.default("DRAFT"),
  validUntil: z.coerce.date().optional(),
  notes: z.string().trim().max(1000).optional(),

  customerId: z.uuid(),
  eventId: z.uuid().optional(),

  tax: z.coerce.number().min(0).max(100).default(19),
  discount: z.coerce.number().min(0).max(100).default(0),

  items: z.array(quoteItemSchema).min(1),
});

export const updateQuoteSchema = z.object({
  quoteNo: z.string().trim().min(1).max(50).optional(),
  status: quoteStatusSchema.optional(),
  validUntil: z.coerce.date().optional(),
  notes: z.string().trim().max(1000).optional(),

  customerId: z.uuid().optional(),
  eventId: z.uuid().optional(),

  tax: z.coerce.number().min(0).max(100).optional(),
  discount: z.coerce.number().min(0).max(100).optional(),

  items: z.array(quoteItemSchema).min(1).optional(),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
