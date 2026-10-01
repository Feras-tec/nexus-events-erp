import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import {
  createBranchSchema,
  updateBranchSchema,
} from "../schemas/branch.schema.js";

// Neue Niederlassung erstellen
export const createBranch = async (req: Request, res: Response) => {
  const result = createBranchSchema.safeParse(req.body);

  // Ungültige Eingabedaten ablehnen
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    // Prüfen, ob die Firma existiert und aktiv ist
    const company = await prisma.company.findUnique({
      where: {
        id: result.data.companyId,
      },
    });

    if (!company) {
      return res.status(404).json({
        error: "Company not found",
      });
    }

    if (!company.isActive) {
      return res.status(400).json({
        error: "Company is inactive",
      });
    }

    const branch = await prisma.branch.create({
      data: result.data,
    });

    return res.status(201).json({
      data: branch,
    });
  } catch (error) {
    console.error("Create branch error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Alle Niederlassungen abrufen
export const getBranches = async (_req: Request, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        company: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      data: branches,
    });
  } catch (error) {
    console.error("Get branches error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Eine Niederlassung anhand ihrer ID abrufen
export const getBranchById = async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        company: true,
        departments: true,
        warehouses: true,
      },
    });

    if (!branch) {
      return res.status(404).json({
        error: "Branch not found",
      });
    }

    return res.status(200).json({
      data: branch,
    });
  } catch (error) {
    console.error("Get branch error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Daten einer Niederlassung teilweise aktualisieren
export const updateBranch = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const result = updateBranchSchema.safeParse(req.body);

  // Ungültige Eingabedaten ablehnen
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    const existingBranch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!existingBranch) {
      return res.status(404).json({
        error: "Branch not found",
      });
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: result.data,
    });

    return res.status(200).json({
      data: branch,
    });
  } catch (error) {
    console.error("Update branch error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Niederlassung deaktivieren, ohne historische Daten zu löschen
export const deactivateBranch = async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const existingBranch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!existingBranch) {
      return res.status(404).json({
        error: "Branch not found",
      });
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return res.status(200).json({
      message: "Branch deactivated successfully",
      data: branch,
    });
  } catch (error) {
    console.error("Deactivate branch error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
