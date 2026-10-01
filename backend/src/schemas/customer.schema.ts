import { z } from "zod";

// Mögliche Kundentypen
const customerTypeSchema = z.enum(["COMPANY", "PRIVATE"]);

// Gemeinsame Felder für Kundendaten
const customerBaseSchema = z.object({
  customerNo: z.string().trim().min(2).max(30),
  type: customerTypeSchema.default("COMPANY"),

  companyName: z.string().trim().max(150).optional(),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  contactName: z.string().trim().max(150).optional(),

  email: z.email().optional(),
  phone: z.string().trim().max(50).optional(),
  address: z.string().trim().max(255).optional(),
  vatId: z.string().trim().max(50).optional(),

  discount: z.number().min(0).max(100).default(0),
});

// Validierung für das Erstellen eines Kunden
export const createCustomerSchema = customerBaseSchema.superRefine(
  (data, ctx) => {
    // Firmenkunden benötigen einen Firmennamen
    if (data.type === "COMPANY" && !data.companyName) {
      ctx.addIssue({
        code: "custom",
        path: ["companyName"],
        message: "Company name is required for company customers",
      });
    }

    // Privatkunden benötigen Vor- und Nachnamen
    if (data.type === "PRIVATE") {
      if (!data.firstName) {
        ctx.addIssue({
          code: "custom",
          path: ["firstName"],
          message: "First name is required for private customers",
        });
      }

      if (!data.lastName) {
        ctx.addIssue({
          code: "custom",
          path: ["lastName"],
          message: "Last name is required for private customers",
        });
      }
    }
  },
);

// Validierung für das Aktualisieren eines Kunden
export const updateCustomerSchema = customerBaseSchema
  .omit({
    customerNo: true,
  })
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
