import { Router } from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
} from "../controllers/invoice.controller.js";
import { requireRole } from "../middleware/require-role.js";

const router = Router();

// Alle Rechnungen abrufen
router.get(
  "/",
  requireRole(
    "OWNER",
    "ADMIN",
    "ACCOUNTANT",
    "SALES_MANAGER",
    "PROJECT_MANAGER",
  ),
  getInvoices,
);

// Einzelne Rechnung abrufen
router.get(
  "/:id",
  requireRole(
    "OWNER",
    "ADMIN",
    "ACCOUNTANT",
    "SALES_MANAGER",
    "PROJECT_MANAGER",
  ),
  getInvoiceById,
);

// Neue Rechnung erstellen
router.post("/", requireRole("OWNER", "ADMIN", "ACCOUNTANT"), createInvoice);

// Rechnung aktualisieren
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN", "ACCOUNTANT"),
  updateInvoice,
);

export default router;
