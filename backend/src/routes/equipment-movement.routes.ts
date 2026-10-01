import { Router } from "express";
import {
  createEquipmentMovement,
  getEquipmentMovements,
} from "../controllers/equipment-movement.controller.js";
import { requireRole } from "../middleware/require-role.js";

const router = Router();

// Bewegungshistorie eines Geräts abrufen
router.get(
  "/:inventoryItemId",
  requireRole(
    "OWNER",
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "WAREHOUSE_EMPLOYEE",
    "PROJECT_MANAGER",
    "DEPARTMENT_MANAGER",
    "TECHNICIAN",
  ),
  getEquipmentMovements,
);

// Neue Gerätebewegung erstellen
router.post(
  "/:inventoryItemId",
  requireRole("OWNER", "ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_EMPLOYEE"),
  createEquipmentMovement,
);

export default router;
