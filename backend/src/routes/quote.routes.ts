import { Router } from "express";
import {
  createQuote,
  getQuotes,
  getQuoteById,
  restoreQuote,
  sendQuoteEmail,
  updateQuote,
} from "../controllers/quote.controller.js";
import { requireRole } from "../middleware/require-role.js";

const router = Router();

// Alle Angebote abrufen
router.get(
  "/",
  requireRole(
    "OWNER",
    "ADMIN",
    "SALES_MANAGER",
    "SALES_EMPLOYEE",
    "PROJECT_MANAGER",
    "ACCOUNTANT",
  ),
  getQuotes,
);

// Einzelnes Angebot abrufen
router.get(
  "/:id",
  requireRole(
    "OWNER",
    "ADMIN",
    "SALES_MANAGER",
    "SALES_EMPLOYEE",
    "PROJECT_MANAGER",
    "ACCOUNTANT",
  ),
  getQuoteById,
);

// Neues Angebot erstellen
router.post(
  "/",
  requireRole("OWNER", "ADMIN", "SALES_MANAGER", "SALES_EMPLOYEE"),
  createQuote,
);

// Stornierung eines Angebots aufheben
router.post(
  "/:id/restore",
  requireRole("OWNER", "ADMIN", "SALES_MANAGER", "SALES_EMPLOYEE"),
  restoreQuote,
);

// Angebot per E-Mail senden
router.post(
  "/:id/send-email",
  requireRole("OWNER", "ADMIN", "SALES_MANAGER", "SALES_EMPLOYEE"),
  sendQuoteEmail,
);

// Angebot aktualisieren
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN", "SALES_MANAGER", "SALES_EMPLOYEE"),
  updateQuote,
);

export default router;
