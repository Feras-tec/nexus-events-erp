import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { createEmployeeDocumentSchema } from "../schemas/employee-document.schema.js";

// Neues Dokument für einen Mitarbeiter erstellen
export const createEmployeeDocument = async (
  req: Request,
  res: Response,
) => {
  const employeeId = String(req.params.employeeId);
  const result = createEmployeeDocumentSchema.safeParse(req.body);

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

    const document = await prisma.employeeDocument.create({
      data: {
        ...result.data,
        employeeId,
      },
    });

    return res.status(201).json({
      data: document,
    });
  } catch (error) {
    console.error("Create employee document error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
