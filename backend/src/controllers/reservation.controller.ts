import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import {
  createReservationSchema,
  updateReservationSchema,
} from "../schemas/reservation.schema.js";

// Prüft, ob sich zwei Reservierungszeiträume überschneiden
async function hasReservationConflict(
  inventoryItemId: string,
  startDate: Date,
  endDate: Date,
  excludeReservationId?: string,
) {
  const conflict = await prisma.reservation.findFirst({
    where: {
      inventoryItemId,

      // Stornierte Reservierungen blockieren das Gerät nicht
      status: {
        not: "CANCELLED",
      },

      // Prüft, ob sich die Zeiträume überschneiden
      startDate: {
        lt: endDate,
      },
      endDate: {
        gt: startDate,
      },

      // Beim Aktualisieren die aktuelle Reservierung ausschließen
      ...(excludeReservationId
        ? {
            id: {
              not: excludeReservationId,
            },
          }
        : {}),
    },
  });

  return conflict !== null;
}

// Erstellt eine neue Geräte-Reservierung
export async function createReservation(req: Request, res: Response) {
  try {
    const result = createReservationSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid reservation data",
        details: result.error.flatten(),
      });
    }

    const data = result.data;

    // Prüfen, ob das Event existiert
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
    });

    if (!event) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    // Prüfen, ob das Gerät existiert
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: data.inventoryItemId },
      include: {
        product: true,
      },
    });

    if (!inventoryItem) {
      return res.status(404).json({
        error: "Inventory item not found",
      });
    }

    // Verlorene oder ausgemusterte Geräte dürfen nicht reserviert werden
    if (inventoryItem.status === "RETIRED" || inventoryItem.status === "LOST") {
      return res.status(400).json({
        error: "Inventory item is not available for reservation",
      });
    }

    // Prüfen, ob bereits eine Reservierung im gleichen Zeitraum existiert
    const hasConflict = await hasReservationConflict(
      data.inventoryItemId,
      data.startDate,
      data.endDate,
    );

    if (hasConflict) {
      return res.status(409).json({
        error: "Inventory item is already reserved for this period",
      });
    }

    // Reservierung speichern
    const reservation = await prisma.reservation.create({
      data,
      include: {
        event: true,
        inventoryItem: {
          include: {
            product: true,
            warehouse: true,
          },
        },
      },
    });

    return res.status(201).json(reservation);
  } catch (error) {
    console.error("Create reservation error:", error);

    return res.status(500).json({
      error: "Could not create reservation",
    });
  }
}
// Gibt alle Reservierungen zurück
export async function getReservations(_req: Request, res: Response) {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        event: true,
        inventoryItem: {
          include: {
            product: true,
            warehouse: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    return res.json(reservations);
  } catch (error) {
    console.error("Get reservations error:", error);

    return res.status(500).json({
      error: "Could not get reservations",
    });
  }
}
// Gibt eine einzelne Reservierung zurück
export async function getReservationById(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== "string") {
      return res.status(400).json({
        error: "Invalid reservation ID",
      });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            customer: true,
          },
        },
        inventoryItem: {
          include: {
            product: true,
            warehouse: {
              include: {
                branch: true,
              },
            },
          },
        },
      },
    });

    if (!reservation) {
      return res.status(404).json({
        error: "Reservation not found",
      });
    }

    return res.json(reservation);
  } catch (error) {
    console.error("Get reservation error:", error);

    return res.status(500).json({
      error: "Could not get reservation",
    });
  }
}
// Aktualisiert eine bestehende Reservierung
export async function updateReservation(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== "string") {
      return res.status(400).json({
        error: "Invalid reservation ID",
      });
    }

    const result = updateReservationSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid reservation data",
        details: result.error.flatten(),
      });
    }

    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!existingReservation) {
      return res.status(404).json({
        error: "Reservation not found",
      });
    }

    const startDate = result.data.startDate ?? existingReservation.startDate;

    const endDate = result.data.endDate ?? existingReservation.endDate;

    // Enddatum darf nicht vor dem Startdatum liegen
    if (endDate < startDate) {
      return res.status(400).json({
        error: "End date must not be before start date",
      });
    }

    // Bei aktiven Reservierungen auf Überschneidungen prüfen
    const newStatus = result.data.status ?? existingReservation.status;

    if (newStatus !== "CANCELLED") {
      const hasConflict = await hasReservationConflict(
        existingReservation.inventoryItemId,
        startDate,
        endDate,
        id,
      );

      if (hasConflict) {
        return res.status(409).json({
          error: "Inventory item is already reserved for this period",
        });
      }
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: result.data,
      include: {
        event: true,
        inventoryItem: {
          include: {
            product: true,
            warehouse: true,
          },
        },
      },
    });

    return res.json(reservation);
  } catch (error) {
    console.error("Update reservation error:", error);

    return res.status(500).json({
      error: "Could not update reservation",
    });
  }
}
