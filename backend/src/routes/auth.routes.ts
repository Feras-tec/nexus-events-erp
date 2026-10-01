import { Router } from "express";
import { getAuth } from "@clerk/express";

const router = Router();

// Aktuell angemeldeten Benutzer abrufen
router.get("/me", (req, res) => {
  const { isAuthenticated, userId } = getAuth(req);

  if (!isAuthenticated || !userId) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  return res.status(200).json({
    authenticated: true,
    userId,
  });
});

export default router;
