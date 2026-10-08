import { Router } from "express";
import { getAuth, clerkClient } from "@clerk/express";
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

  try {
    let email: string | null = null;
    let clerkAvailable = true;

    try {
      const clerkUser = await clerkClient.users.getUser(userId);

      email =
        clerkUser.emailAddresses.find(
          (address) => address.id === clerkUser.primaryEmailAddressId,
        )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? null;
    } catch (error) {
      clerkAvailable = false;
      console.error("Failed to fetch Clerk user:", error);
    }

    if (!clerkAvailable) {
      const existingUser = await prisma.appUser.findUnique({
        where: { clerkUserId: userId },
      });

      if (!existingUser) {
        return res.status(503).json({
          error: "User verification temporarily unavailable",
        });
      }

      return res.status(200).json({
        authenticated: true,
        user: {
          id: existingUser.id,
          clerkUserId: existingUser.clerkUserId,
          role: existingUser.role,
          isActive: existingUser.isActive,
        },
      });
    }

    const appUser = await prisma.appUser.upsert({
      where: { clerkUserId: userId },
      update: { email },
      create: {
        clerkUserId: userId,
        email,
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
  } catch (error) {
    console.error("Failed to initialize app user:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }

});

export default router;
