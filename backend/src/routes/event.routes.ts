import { Router } from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
} from "../controllers/event.controller.js";
import { requireRole } from "../middleware/require-role.js";

const router = Router();

// Alle Events abrufen
router.get(
  "/",
  requireRole(
    "OWNER",
    "ADMIN",
    "PROJECT_MANAGER",
    "SALES_MANAGER",
    "SALES_EMPLOYEE",
    "DEPARTMENT_MANAGER",
    "WAREHOUSE_MANAGER",
    "TECHNICIAN",
  ),
  getEvents,
);

// Ein Event anhand seiner ID abrufen
router.get(
  "/:id",
  requireRole(
    "OWNER",
    "ADMIN",
    "PROJECT_MANAGER",
    "SALES_MANAGER",
    "SALES_EMPLOYEE",
    "DEPARTMENT_MANAGER",
    "WAREHOUSE_MANAGER",
    "TECHNICIAN",
  ),
  getEventById,
);

// Event-Daten teilweise aktualisieren
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN", "PROJECT_MANAGER"),
  updateEvent,
);

// Neues Event erstellen
router.post(
  "/",
  requireRole("OWNER", "ADMIN", "PROJECT_MANAGER", "SALES_MANAGER"),
  createEvent,
);

export default router;
