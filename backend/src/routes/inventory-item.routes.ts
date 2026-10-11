import {
  bulkGenerateInventoryItems,
  scanReceiveInventoryItem,
} from "../controllers/inventory-barcode.controller.js";
import { Router } from "express";
import {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
} from "../controllers/inventory-item.controller.js";
import { requireRole } from "../middleware/require-role.js";

const router = Router();

// Wareneingang durch Barcode-Scan registrieren
router.post(
  "/scan-receive",
  requireRole("OWNER", "ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_EMPLOYEE"),
  scanReceiveInventoryItem,
);

// Mehrere Barcode-Artikel für die Lagerregistrierung erzeugen
router.post(
  "/bulk-generate",
  requireRole("OWNER", "ADMIN", "WAREHOUSE_MANAGER"),
  bulkGenerateInventoryItems,
);


// Alle Lagerartikel abrufen
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
  getInventoryItems,
);

// Einen Lagerartikel anhand seiner ID abrufen
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
  getInventoryItemById,
);

// Lagerartikel teilweise aktualisieren
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_EMPLOYEE"),
  updateInventoryItem,
);

// Neuen Lagerartikel erstellen
router.post(
  "/",
  requireRole("OWNER", "ADMIN", "WAREHOUSE_MANAGER"),
  createInventoryItem,
);

export default router;
