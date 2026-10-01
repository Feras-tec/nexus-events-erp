import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import type { UserRole } from "../generated/prisma/client.js";
import prisma from "../lib/prisma.js";

// Zugriff nur für Benutzer mit erlaubten Rollen
export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const appUser = await prisma.appUser.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!appUser || !appUser.isActive) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    if (!allowedRoles.includes(appUser.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
      });
    }

    next();
  };
}
