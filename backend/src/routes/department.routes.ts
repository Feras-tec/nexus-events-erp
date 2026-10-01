import { Router } from "express";
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deactivateDepartment,
} from "../controllers/department.controller.js";

const router = Router();

// Alle Abteilungen abrufen
router.get("/", getDepartments);

// Eine Abteilung anhand ihrer ID abrufen
router.get("/:id", getDepartmentById);

// Abteilung deaktivieren statt endgültig löschen
router.patch("/:id/deactivate", deactivateDepartment);

// Daten einer Abteilung teilweise aktualisieren
router.patch("/:id", updateDepartment);

// Neue Abteilung erstellen
router.post("/", createDepartment);

export default router;
