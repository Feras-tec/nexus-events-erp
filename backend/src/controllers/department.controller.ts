import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "../schemas/department.schema.js";

// Neue Abteilung erstellen
export const createDepartment = async (req: Request, res: Response) => {
  const result = createDepartmentSchema.safeParse(req.body);

  // Ungültige Eingabedaten ablehnen
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    // Prüfen, ob die Niederlassung existiert und aktiv ist
    const branch = await prisma.branch.findUnique({
      where: {
        id: result.data.branchId,
      },
    });

    if (!branch) {
      return res.status(404).json({
        error: "Branch not found",
      });
    }

    if (!branch.isActive) {
      return res.status(400).json({
        error: "Branch is inactive",
      });
    }

    const department = await prisma.department.create({
      data: result.data,
    });

    return res.status(201).json({
      data: department,
    });
  } catch (error) {
    console.error("Create department error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Alle Abteilungen abrufen
export const getDepartments = async (_req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        branch: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      data: departments,
    });
  } catch (error) {
    console.error("Get departments error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Eine Abteilung anhand ihrer ID abrufen
export const getDepartmentById = async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        branch: {
          include: {
            company: true,
          },
        },
        employees: true,
      },
    });

    if (!department) {
      return res.status(404).json({
        error: "Department not found",
      });
    }

    return res.status(200).json({
      data: department,
    });
  } catch (error) {
    console.error("Get department error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Daten einer Abteilung teilweise aktualisieren
export const updateDepartment = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const result = updateDepartmentSchema.safeParse(req.body);

  // Ungültige Eingabedaten ablehnen
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      return res.status(404).json({
        error: "Department not found",
      });
    }

    const department = await prisma.department.update({
      where: { id },
      data: result.data,
    });

    return res.status(200).json({
      data: department,
    });
  } catch (error) {
    console.error("Update department error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Abteilung deaktivieren, ohne historische Daten zu löschen
export const deactivateDepartment = async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      return res.status(404).json({
        error: "Department not found",
      });
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return res.status(200).json({
      message: "Department deactivated successfully",
      data: department,
    });
  } catch (error) {
    console.error("Deactivate department error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
