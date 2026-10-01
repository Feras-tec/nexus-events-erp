import { Router } from "express";
import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deactivateBranch,
} from "../controllers/branch.controller.js";
import { requireRole } from "../middleware/require-role.js";

const router = Router();

// Alle Niederlassungen abrufen
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
  getBranches,
);

// Eine Niederlassung anhand ihrer ID abrufen
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
  getBranchById,
);

// Niederlassung deaktivieren statt endgültig löschen
router.patch(
  "/:id/deactivate",
  requireRole("OWNER", "ADMIN"),
  deactivateBranch,
);

// Daten einer Niederlassung teilweise aktualisieren
router.patch("/:id", requireRole("OWNER", "ADMIN"), updateBranch);

// Neue Niederlassung erstellen
router.post("/", requireRole("OWNER", "ADMIN"), createBranch);

export default router;
