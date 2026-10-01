import { Router } from "express";
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deactivateDepartment,
} from "../controllers/department.controller.js";
import { requireRole } from "../middleware/require-role.js";

const router = Router();

// Alle Abteilungen abrufen
router.get(
  "/",
  requireRole(
    "OWNER",
    "ADMIN",
    "HR_MANAGER",
    "PROJECT_MANAGER",
    "DEPARTMENT_MANAGER",
    "WAREHOUSE_MANAGER",
  ),
  getDepartments,
);

// Eine Abteilung anhand ihrer ID abrufen
router.get(
  "/:id",
  requireRole(
    "OWNER",
    "ADMIN",
    "HR_MANAGER",
    "PROJECT_MANAGER",
    "DEPARTMENT_MANAGER",
    "WAREHOUSE_MANAGER",
  ),
  getDepartmentById,
);

// Abteilung deaktivieren statt endgültig löschen
router.patch(
  "/:id/deactivate",
  requireRole("OWNER", "ADMIN"),
  deactivateDepartment,
);

// Daten einer Abteilung teilweise aktualisieren
router.patch("/:id", requireRole("OWNER", "ADMIN"), updateDepartment);

// Neue Abteilung erstellen
router.post("/", requireRole("OWNER", "ADMIN"), createDepartment);

export default router;
