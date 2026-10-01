import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "../schemas/employee.schema.js";

// Neuen Mitarbeiter erstellen
export const createEmployee = async (req: Request, res: Response) => {
  const result = createEmployeeSchema.safeParse(req.body);

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

    // Falls eine Abteilung angegeben wurde, diese ebenfalls prüfen
    if (result.data.departmentId) {
      const department = await prisma.department.findUnique({
        where: {
          id: result.data.departmentId,
        },
      });

      if (!department) {
        return res.status(404).json({
          error: "Department not found",
        });
      }

      if (!department.isActive) {
        return res.status(400).json({
          error: "Department is inactive",
        });
      }

      // Mitarbeiter und Abteilung müssen zur gleichen Niederlassung gehören
      if (department.branchId !== result.data.branchId) {
        return res.status(400).json({
          error: "Department does not belong to the selected branch",
        });
      }
    }

    const employee = await prisma.employee.create({
      data: result.data,
    });

    return res.status(201).json({
      data: employee,
    });
  } catch (error) {
    console.error("Create employee error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Alle Mitarbeiter abrufen
export const getEmployees = async (_req: Request, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        branch: true,
        department: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      data: employees,
    });
  } catch (error) {
    console.error("Get employees error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Einen Mitarbeiter anhand seiner ID abrufen
export const getEmployeeById = async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        branch: {
          include: {
            company: true,
          },
        },
        department: true,
        employmentPeriods: true,
        documents: true,
      },
    });

    if (!employee) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    return res.status(200).json({
      data: employee,
    });
  } catch (error) {
    console.error("Get employee error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Daten eines Mitarbeiters teilweise aktualisieren
export const updateEmployee = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const result = updateEmployeeSchema.safeParse(req.body);

  // Ungültige Eingabedaten ablehnen
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    // Neue Abteilung prüfen, falls sie geändert wird
    if (result.data.departmentId) {
      const department = await prisma.department.findUnique({
        where: {
          id: result.data.departmentId,
        },
      });

      if (!department) {
        return res.status(404).json({
          error: "Department not found",
        });
      }

      if (!department.isActive) {
        return res.status(400).json({
          error: "Department is inactive",
        });
      }

      // Die Abteilung muss zur Niederlassung des Mitarbeiters gehören
      if (department.branchId !== existingEmployee.branchId) {
        return res.status(400).json({
          error: "Department does not belong to the employee branch",
        });
      }
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: result.data,
    });

    return res.status(200).json({
      data: employee,
    });
  } catch (error) {
    console.error("Update employee error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
// Mitarbeiter deaktivieren, ohne historische Daten zu löschen
export const deactivateEmployee = async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        status: "INACTIVE",
      },
    });

    return res.status(200).json({
      message: "Employee deactivated successfully",
      data: employee,
    });
  } catch (error) {
    console.error("Deactivate employee error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
