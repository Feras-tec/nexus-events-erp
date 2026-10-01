import { Router } from "express";
import {
  createReservation,
  getReservations,
  getReservationById,
  updateReservation,
} from "../controllers/reservation.controller.js";

const router = Router();

// Alle Reservierungen abrufen
router.get("/", getReservations);

// Eine Reservierung nach ID abrufen
router.get("/:id", getReservationById);

router.patch("/:id", updateReservation);

// Neue Reservierung erstellen
router.post("/", createReservation);

export default router;
