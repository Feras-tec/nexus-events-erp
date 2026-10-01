import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deactivateProduct,
} from "../controllers/product.controller.js";
import { requireRole } from "../middleware/require-role.js";

const router = Router();

// Alle Produkte abrufen
router.get(
  "/",
  requireRole(
    "OWNER",
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "WAREHOUSE_EMPLOYEE",
    "SALES_MANAGER",
    "SALES_EMPLOYEE",
    "PROJECT_MANAGER",
    "DEPARTMENT_MANAGER",
    "TECHNICIAN",
  ),
  getProducts,
);

// Ein Produkt anhand seiner ID abrufen
router.get(
  "/:id",
  requireRole(
    "OWNER",
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "WAREHOUSE_EMPLOYEE",
    "SALES_MANAGER",
    "SALES_EMPLOYEE",
    "PROJECT_MANAGER",
    "DEPARTMENT_MANAGER",
    "TECHNICIAN",
  ),
  getProductById,
);

// Produkt deaktivieren statt endgültig löschen
router.patch(
  "/:id/deactivate",
  requireRole("OWNER", "ADMIN", "WAREHOUSE_MANAGER"),
  deactivateProduct,
);

// Produktdaten teilweise aktualisieren
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN", "WAREHOUSE_MANAGER"),
  updateProduct,
);

// Neues Produkt erstellen
router.post(
  "/",
  requireRole("OWNER", "ADMIN", "WAREHOUSE_MANAGER"),
  createProduct,
);

export default router;
