import { Router } from "express";
import { getAuth } from "@clerk/express";
import prisma from "../lib/prisma.js";

const router = Router();

// Aktuell angemeldeten Benutzer abrufen
router.get("/me", async (req, res) => {
  const { isAuthenticated, userId } = getAuth(req);

  if (!isAuthenticated || !userId) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  // Benutzer beim ersten Zugriff automatisch anlegen
  const appUser = await prisma.appUser.upsert({
    where: {
      clerkUserId: userId,
    },
    update: {},
    create: {
      clerkUserId: userId,
      role: "EMPLOYEE",
    },
  });

  return res.status(200).json({
    authenticated: true,
    user: {
      id: appUser.id,
      clerkUserId: appUser.clerkUserId,
      role: appUser.role,
      isActive: appUser.isActive,
    },
  });
});

export default router;
