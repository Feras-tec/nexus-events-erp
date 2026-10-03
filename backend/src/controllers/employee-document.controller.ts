import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import {
  createEmployeeDocumentSchema,
  updateEmployeeDocumentSchema,
} from "../schemas/employee-document.schema.js";

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


// Mitarbeiterdokument teilweise aktualisieren
export const updateEmployeeDocument = async (
  req: Request,
  res: Response,
) => {
  const employeeId = String(req.params.employeeId);
  const documentId = String(req.params.documentId);

  const result = updateEmployeeDocumentSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    const document = await prisma.employeeDocument.findFirst({
      where: {
        id: documentId,
        employeeId,
      },
    });

    if (!document) {
      return res.status(404).json({
        error: "Employee document not found",
      });
    }

    const issueDate =
      result.data.issueDate === undefined
        ? document.issueDate
        : result.data.issueDate;

    const expiryDate =
      result.data.expiryDate === undefined
        ? document.expiryDate
        : result.data.expiryDate;

    if (issueDate && expiryDate && expiryDate < issueDate) {
      return res.status(400).json({
        error: "Validation failed",
        details: {
          fieldErrors: {
            expiryDate: [
              "Expiry date must not be before issue date",
            ],
          },
        },
      });
    }

    const updatedDocument =
      await prisma.employeeDocument.update({
        where: {
          id: documentId,
        },
        data: result.data,
      });

    return res.status(200).json({
      data: updatedDocument,
    });
  } catch (error) {
    console.error("Update employee document error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Mitarbeiterdokument löschen
export const deleteEmployeeDocument = async (
  req: Request,
  res: Response,
) => {
  const employeeId = String(req.params.employeeId);
  const documentId = String(req.params.documentId);

  try {
    const document = await prisma.employeeDocument.findFirst({
      where: {
        id: documentId,
        employeeId,
      },
    });

    if (!document) {
      return res.status(404).json({
        error: "Employee document not found",
      });
    }

    await prisma.employeeDocument.delete({
      where: {
        id: documentId,
      },
    });

    return res.status(200).json({
      message: "Employee document deleted successfully",
    });
  } catch (error) {
    console.error("Delete employee document error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
