import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import {
  createEmploymentPeriodSchema,
  updateEmploymentPeriodSchema,
} from "../schemas/employment-period.schema.js";

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

// Beschäftigungszeitraum teilweise aktualisieren
export const updateEmploymentPeriod = async (
  req: Request,
  res: Response,
) => {
  const employeeId = String(req.params.employeeId);
  const periodId = String(req.params.periodId);

  const result = updateEmploymentPeriodSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    const employmentPeriod =
      await prisma.employmentPeriod.findFirst({
        where: {
          id: periodId,
          employeeId,
        },
      });

    if (!employmentPeriod) {
      return res.status(404).json({
        error: "Employment period not found",
      });
    }

    const startDate =
      result.data.startDate ?? employmentPeriod.startDate;

    const endDate =
      result.data.endDate === undefined
        ? employmentPeriod.endDate
        : result.data.endDate;

    if (endDate && endDate < startDate) {
      return res.status(400).json({
        error: "Validation failed",
        details: {
          fieldErrors: {
            endDate: [
              "End date must not be before start date",
            ],
          },
        },
      });
    }

    const updatedEmploymentPeriod =
      await prisma.employmentPeriod.update({
        where: {
          id: periodId,
        },
        data: result.data,
      });

    return res.status(200).json({
      data: updatedEmploymentPeriod,
    });
  } catch (error) {
    console.error("Update employment period error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Beschäftigungszeitraum löschen
export const deleteEmploymentPeriod = async (
  req: Request,
  res: Response,
) => {
  const employeeId = String(req.params.employeeId);
  const periodId = String(req.params.periodId);

  try {
    const employmentPeriod =
      await prisma.employmentPeriod.findFirst({
        where: {
          id: periodId,
          employeeId,
        },
      });

    if (!employmentPeriod) {
      return res.status(404).json({
        error: "Employment period not found",
      });
    }

    await prisma.employmentPeriod.delete({
      where: {
        id: periodId,
      },
    });

    return res.status(200).json({
      message: "Employment period deleted successfully",
    });
  } catch (error) {
    console.error("Delete employment period error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

