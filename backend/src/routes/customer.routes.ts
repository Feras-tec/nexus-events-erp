import { Router } from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deactivateCustomer,
} from "../controllers/customer.controller.js";
import { requireRole } from "../middleware/require-role.js";

const router = Router();

// Alle Kunden abrufen
router.get(
  "/",
  requireRole(
    "OWNER",
    "ADMIN",
    "SALES_MANAGER",
    "SALES_EMPLOYEE",
    "PROJECT_MANAGER",
  ),
  getCustomers,
);

// Einen Kunden anhand seiner ID abrufen
router.get(
  "/:id",
  requireRole(
    "OWNER",
    "ADMIN",
    "SALES_MANAGER",
    "SALES_EMPLOYEE",
    "PROJECT_MANAGER",
  ),
  getCustomerById,
);

// Kunden deaktivieren statt endgültig löschen
router.patch(
  "/:id/deactivate",
  requireRole("OWNER", "ADMIN", "SALES_MANAGER"),
  deactivateCustomer,
);

// Kundendaten teilweise aktualisieren
router.patch(
  "/:id",
  requireRole(
    "OWNER",
    "ADMIN",
    "SALES_MANAGER",
    "SALES_EMPLOYEE",
    "PROJECT_MANAGER",
  ),
  updateCustomer,
);

// Neuen Kunden erstellen
router.post(
  "/",
  requireRole(
    "OWNER",
    "ADMIN",
    "SALES_MANAGER",
    "SALES_EMPLOYEE",
    "PROJECT_MANAGER",
  ),
  createCustomer,
);
export default router;
