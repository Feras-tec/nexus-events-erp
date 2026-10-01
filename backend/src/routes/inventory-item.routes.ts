import { Router } from "express";
import {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
} from "../controllers/inventory-item.controller.js";

const router = Router();

// Alle Lagerartikel abrufen
router.get("/", getInventoryItems);

// Einen Lagerartikel anhand seiner ID abrufen
router.get("/:id", getInventoryItemById);

// Lagerartikel teilweise aktualisieren
router.patch("/:id", updateInventoryItem);

// Neuen Lagerartikel erstellen
router.post("/", createInventoryItem);

export default router;
