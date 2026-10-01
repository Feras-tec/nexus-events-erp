import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deactivateProduct,
} from "../controllers/product.controller.js";

const router = Router();

// Alle Produkte abrufen
router.get("/", getProducts);

// Ein Produkt anhand seiner ID abrufen
router.get("/:id", getProductById);

// Produkt deaktivieren statt endgültig löschen
router.patch("/:id/deactivate", deactivateProduct);

// Produktdaten teilweise aktualisieren
router.patch("/:id", updateProduct);

// Neues Produkt erstellen
router.post("/", createProduct);

export default router;
