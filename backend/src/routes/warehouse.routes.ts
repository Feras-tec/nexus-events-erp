import { Router } from "express";
import {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deactivateWarehouse,
} from "../controllers/warehouse.controller.js";
import { requireRole } from "../middleware/require-role.js";

const router = Router();

// Alle Lager abrufen
router.get(
  "/",
  requireRole(
    "OWNER",
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "WAREHOUSE_EMPLOYEE",
    "PROJECT_MANAGER",
    "DEPARTMENT_MANAGER",
    "TECHNICIAN",
  ),
  getWarehouses,
);

// Ein Lager anhand seiner ID abrufen
router.get(
  "/:id",
  requireRole(
    "OWNER",
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "WAREHOUSE_EMPLOYEE",
    "PROJECT_MANAGER",
    "DEPARTMENT_MANAGER",
    "TECHNICIAN",
  ),
  getWarehouseById,
);

// Lager deaktivieren statt endgültig löschen
router.patch(
  "/:id/deactivate",
  requireRole("OWNER", "ADMIN", "WAREHOUSE_MANAGER"),
  deactivateWarehouse,
);

// Daten eines Lagers teilweise aktualisieren
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN", "WAREHOUSE_MANAGER"),
  updateWarehouse,
);

// Neues Lager erstellen
router.post(
  "/",
  requireRole("OWNER", "ADMIN", "WAREHOUSE_MANAGER"),
  createWarehouse,
);

export default router;
