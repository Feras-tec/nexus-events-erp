import { Router } from "express";
import {
  createEquipmentMovement,
  getEquipmentMovements,
} from "../controllers/equipment-movement.controller.js";

const router = Router();

// Bewegungshistorie eines Geräts abrufen
router.get("/:inventoryItemId", getEquipmentMovements);

// Neue Gerätebewegung erstellen
router.post("/:inventoryItemId", createEquipmentMovement);

export default router;
