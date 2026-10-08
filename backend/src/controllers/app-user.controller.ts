import type { Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";

const roles = [
  "ADMIN",
  "HR_MANAGER",
  "ACCOUNTANT",
  "SALES_MANAGER",
  "PROJECT_MANAGER",
  "DEPARTMENT_MANAGER",
  "WAREHOUSE_MANAGER",
  "TECHNICIAN",
  "WAREHOUSE_EMPLOYEE",
  "SALES_EMPLOYEE",
  "EMPLOYEE",
] as const;

const updateUserSchema = z.object({
  role: z.enum(roles).optional(),
  isActive: z.boolean().optional(),
}).strict().refine(
  (data) => data.role !== undefined || data.isActive !== undefined,
  { message: "No changes provided" },
);

export async function getAppUsers(_req: Request, res: Response) {
  try {
    const users = await prisma.appUser.findMany({
      select: {
        id: true,
        clerkUserId: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Failed to load app users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateAppUser(req: Request, res: Response) {
  const id = req.params.id;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const parsed = updateUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid user data",
      details: parsed.error.flatten(),
    });
  }

  try {
    const user = await prisma.appUser.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "OWNER") {
      return res.status(403).json({
        error: "Owner account cannot be modified",
      });
    }

    const updated = await prisma.appUser.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        clerkUserId: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ user: updated });
  } catch (error) {
    console.error("Failed to update app user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
