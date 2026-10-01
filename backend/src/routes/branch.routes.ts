import { Router } from "express";
import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deactivateBranch,
} from "../controllers/branch.controller.js";

const router = Router();

// Alle Niederlassungen abrufen
router.get("/", getBranches);

// Eine Niederlassung anhand ihrer ID abrufen
router.get("/:id", getBranchById);

// Niederlassung deaktivieren statt endgültig löschen
router.patch("/:id/deactivate", deactivateBranch);

// Daten einer Niederlassung teilweise aktualisieren
router.patch("/:id", updateBranch);

// Neue Niederlassung erstellen
router.post("/", createBranch);

export default router;
