import { Router } from "express";
import {
  createReservation,
  getReservations,
  getReservationById,
  updateReservation,
} from "../controllers/reservation.controller.js";
import { requireRole } from "../middleware/require-role.js";

const router = Router();

// Alle Reservierungen abrufen
router.get(
  "/",
  requireRole(
    "OWNER",
    "ADMIN",
    "PROJECT_MANAGER",
    "WAREHOUSE_MANAGER",
    "WAREHOUSE_EMPLOYEE",
    "DEPARTMENT_MANAGER",
    "TECHNICIAN",
  ),
  getReservations,
);

// Eine Reservierung nach ID abrufen
router.get(
  "/:id",
  requireRole(
    "OWNER",
    "ADMIN",
    "PROJECT_MANAGER",
    "WAREHOUSE_MANAGER",
    "WAREHOUSE_EMPLOYEE",
    "DEPARTMENT_MANAGER",
    "TECHNICIAN",
  ),
  getReservationById,
);

// Reservierung teilweise aktualisieren
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN", "PROJECT_MANAGER", "WAREHOUSE_MANAGER"),
  updateReservation,
);

// Neue Reservierung erstellen
router.post(
  "/",
  requireRole("OWNER", "ADMIN", "PROJECT_MANAGER", "WAREHOUSE_MANAGER"),
  createReservation,
);

export default router;
