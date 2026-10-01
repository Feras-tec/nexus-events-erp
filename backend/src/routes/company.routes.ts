import { Router } from "express";
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deactivateCompany,
} from "../controllers/company.controller.js";
import { requireRole } from "../middleware/require-role.js";

const router = Router();

// Alle Firmen abrufen
router.get(
  "/",
  requireRole(
    "OWNER",
    "ADMIN",
    "HR_MANAGER",
    "ACCOUNTANT",
    "SALES_MANAGER",
    "PROJECT_MANAGER",
    "DEPARTMENT_MANAGER",
    "WAREHOUSE_MANAGER",
  ),
  getCompanies,
);

// Eine Firma anhand ihrer ID abrufen
router.get(
  "/:id",
  requireRole(
    "OWNER",
    "ADMIN",
    "HR_MANAGER",
    "ACCOUNTANT",
    "SALES_MANAGER",
    "PROJECT_MANAGER",
    "DEPARTMENT_MANAGER",
    "WAREHOUSE_MANAGER",
  ),
  getCompanyById,
);

// Firma deaktivieren statt endgültig löschen
router.patch(
  "/:id/deactivate",
  requireRole("OWNER", "ADMIN"),
  deactivateCompany,
);

// Firmendaten teilweise aktualisieren
router.patch("/:id", requireRole("OWNER", "ADMIN"), updateCompany);

// Neue Firma erstellen
router.post("/", requireRole("OWNER", "ADMIN"), createCompany);

export default router;
