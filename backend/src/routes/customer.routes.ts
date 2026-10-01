import { Router } from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deactivateCustomer,
} from "../controllers/customer.controller.js";

const router = Router();

// Alle Kunden abrufen
router.get("/", getCustomers);

// Einen Kunden anhand seiner ID abrufen
router.get("/:id", getCustomerById);

// Kunden deaktivieren statt endgültig löschen
router.patch("/:id/deactivate", deactivateCustomer);

// Kundendaten teilweise aktualisieren
router.patch("/:id", updateCustomer);

// Neuen Kunden erstellen
router.post("/", createCustomer);

export default router;
