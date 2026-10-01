import { Router } from "express";
import {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deactivateWarehouse,
} from "../controllers/warehouse.controller.js";

const router = Router();

// Alle Lager abrufen
router.get("/", getWarehouses);

// Ein Lager anhand seiner ID abrufen
router.get("/:id", getWarehouseById);

// Lager deaktivieren statt endgültig löschen
router.patch("/:id/deactivate", deactivateWarehouse);

// Daten eines Lagers teilweise aktualisieren
router.patch("/:id", updateWarehouse);

// Neues Lager erstellen
router.post("/", createWarehouse);

export default router;
