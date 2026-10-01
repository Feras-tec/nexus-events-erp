import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { createEmploymentPeriodSchema } from "../schemas/employment-period.schema.js";

// Neuen Beschäftigungszeitraum für einen Mitarbeiter erstellen
export const createEmploymentPeriod = async (
  req: Request,
  res: Response,
) => {
  const employeeId = String(req.params.employeeId);
  const result = createEmploymentPeriodSchema.safeParse(req.body);

  // Ungültige Eingabedaten ablehnen
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    // Prüfen, ob der Mitarbeiter existiert
    const employee = await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
    });

    if (!employee) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    const employmentPeriod = await prisma.employmentPeriod.create({
      data: {
        ...result.data,
        employeeId,
      },
    });

    return res.status(201).json({
      data: employmentPeriod,
    });
  } catch (error) {
    console.error("Create employment period error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
