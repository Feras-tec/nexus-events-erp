import { Router } from "express";
import {
  createQuote,
  getQuotes,
  getQuoteById,
  updateQuote,
} from "../controllers/quote.controller.js";

const router = Router();

// Alle Angebote abrufen
router.get("/", getQuotes);

// Einzelnes Angebot abrufen
router.get("/:id", getQuoteById);

// Neues Angebot erstellen
router.post("/", createQuote);

// Angebot aktualisieren
router.patch("/:id", updateQuote);

export default router;
