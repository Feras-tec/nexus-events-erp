import { Router } from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
} from "../controllers/event.controller.js";

const router = Router();

// Alle Events abrufen
router.get("/", getEvents);

// Ein Event anhand seiner ID abrufen
router.get("/:id", getEventById);

// Event-Daten teilweise aktualisieren
router.patch("/:id", updateEvent);

// Neues Event erstellen
router.post("/", createEvent);

export default router;
