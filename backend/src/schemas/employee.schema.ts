import { z } from "zod";

// Mögliche Statuswerte eines Mitarbeiters
const employeeStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "ON_LEAVE",
  "SUSPENDED",
]);

// Validierung für das Erstellen eines Mitarbeiters
export const createEmployeeSchema = z.object({
  employeeNo: z.string().trim().min(2).max(30),
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),

  email: z.email().optional(),
  phone: z.string().trim().max(50).optional(),
  birthDate: z.coerce.date().optional(),
  nationality: z.string().trim().max(100).optional(),
  position: z.string().trim().max(100).optional(),

  branchId: z.uuid(),
  departmentId: z.uuid().optional(),
});

// Validierung für das Aktualisieren eines Mitarbeiters
export const updateEmployeeSchema = createEmployeeSchema
  .omit({
    employeeNo: true,
    branchId: true,
  })
  .partial()
  .extend({
    status: employeeStatusSchema.optional(),
  });

export type CreateEmployeeInput = z.infer<
  typeof createEmployeeSchema
>;

export type UpdateEmployeeInput = z.infer<
  typeof updateEmployeeSchema
>;
