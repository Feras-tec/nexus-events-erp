import { z } from "zod";

const invoiceStatusSchema = z.enum([
  "DRAFT",
  "ISSUED",
  "PAID",
  "OVERDUE",
  "CANCELLED",
]);

const invoiceItemTypeSchema = z.enum([
  "EQUIPMENT",
  "SERVICE",
  "TRANSPORT",
  "PERSONNEL",
  "OTHER",
]);

const invoiceItemSchema = z.object({
  type: invoiceItemTypeSchema,
  description: z.string().trim().min(1).max(500),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  discount: z.coerce.number().min(0).max(100).default(0),
  productId: z.uuid().optional(),
});

export const createInvoiceSchema = z
  .object({
    invoiceNo: z.string().trim().min(1).max(50),
    status: invoiceStatusSchema.default("DRAFT"),

    issueDate: z.coerce.date().optional(),
    dueDate: z.coerce.date().optional(),
    notes: z.string().trim().max(1000).optional(),

    customerId: z.uuid(),
    eventId: z.uuid().optional(),
    quoteId: z.uuid().optional(),

    tax: z.coerce.number().min(0).max(100).default(19),
    discount: z.coerce.number().min(0).max(100).default(0),

    items: z.array(invoiceItemSchema).min(1),
  })
  .refine(
    (data) =>
      !data.issueDate ||
      !data.dueDate ||
      data.dueDate >= data.issueDate,
    {
      message: "Due date must not be before issue date",
      path: ["dueDate"],
    },
  );

export const updateInvoiceSchema = z.object({
  status: invoiceStatusSchema.optional(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type CreateInvoiceInput = z.infer<
  typeof createInvoiceSchema
>;

export type UpdateInvoiceInput = z.infer<
  typeof updateInvoiceSchema
>;
