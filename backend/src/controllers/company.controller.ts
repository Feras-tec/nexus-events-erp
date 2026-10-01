import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import {
  createCompanySchema,
  updateCompanySchema,
} from "../schemas/company.schema.js";

// Neue Firma erstellen
export const createCompany = async (req: Request, res: Response) => {
  const result = createCompanySchema.safeParse(req.body);

  // Ungültige Eingabedaten ablehnen
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    const company = await prisma.company.create({
      data: result.data,
    });

    return res.status(201).json({
      data: company,
    });
  } catch (error) {
    console.error("Create company error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Alle Firmen abrufen
export const getCompanies = async (_req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      data: companies,
    });
  } catch (error) {
    console.error("Get companies error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
// Eine Firma anhand ihrer ID abrufen
export const getCompanyById = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const company = await prisma.company.findUnique({
      where: {
        id,
      },
    });

    if (!company) {
      return res.status(404).json({
        error: "Company not found",
      });
    }

    return res.status(200).json({
      data: company,
    });
  } catch (error) {
    console.error("Get company error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Firmendaten teilweise aktualisieren
export const updateCompany = async (req: Request, res: Response) => {
  const id = String(req.params.id);

  const result = updateCompanySchema.safeParse(req.body);

  // Ungültige Eingabedaten ablehnen
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      return res.status(404).json({
        error: "Company not found",
      });
    }

    const company = await prisma.company.update({
      where: { id },
      data: result.data,
    });

    return res.status(200).json({
      data: company,
    });
  } catch (error) {
    console.error("Update company error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
// Firma deaktivieren, ohne historische Daten zu löschen
export const deactivateCompany = async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      return res.status(404).json({
        error: "Company not found",
      });
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return res.status(200).json({
      message: "Company deactivated successfully",
      data: company,
    });
  } catch (error) {
    console.error("Deactivate company error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
