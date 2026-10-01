import { Router } from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deactivateEmployee,
} from "../controllers/employee.controller.js";
import { createEmploymentPeriod } from "../controllers/employment-period.controller.js";
import { createEmployeeDocument } from "../controllers/employee-document.controller.js";

const router = Router();

// Alle Mitarbeiter abrufen
router.get("/", getEmployees);

// Neuen Beschäftigungszeitraum für einen Mitarbeiter erstellen
router.post("/:employeeId/employment-periods", createEmploymentPeriod);

// Neues Dokument für einen Mitarbeiter erstellen
router.post("/:employeeId/documents", createEmployeeDocument);

// Einen Mitarbeiter anhand seiner ID abrufen
router.get("/:id", getEmployeeById);

// Mitarbeiter deaktivieren statt endgültig löschen
router.patch("/:id/deactivate", deactivateEmployee);

// Daten eines Mitarbeiters teilweise aktualisieren
router.patch("/:id", updateEmployee);

// Neuen Mitarbeiter erstellen
router.post("/", createEmployee);

export default router;
