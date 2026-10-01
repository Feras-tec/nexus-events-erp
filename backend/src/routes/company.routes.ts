import { Router } from "express";
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deactivateCompany,
} from "../controllers/company.controller.js";

const router = Router();

// Alle Firmen abrufen
router.get("/", getCompanies);

// Eine Firma anhand ihrer ID abrufen
router.get("/:id", getCompanyById);

// Firma deaktivieren statt endgültig löschen
router.patch("/:id/deactivate", deactivateCompany);

// Firmendaten teilweise aktualisieren
router.patch("/:id", updateCompany);

// Neue Firma erstellen
router.post("/", createCompany);

export default router;
