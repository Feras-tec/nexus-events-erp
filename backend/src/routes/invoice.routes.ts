import { Router } from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
} from "../controllers/invoice.controller.js";

const router = Router();

// Alle Rechnungen abrufen
router.get("/", getInvoices);

// Einzelne Rechnung abrufen
router.get("/:id", getInvoiceById);

// Neue Rechnung erstellen
router.post("/", createInvoice);

// Rechnung aktualisieren
router.patch("/:id", updateInvoice);

export default router;
