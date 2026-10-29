import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import {
  createReservationSchema,
  updateReservationSchema,
} from "../schemas/reservation.schema.js";

// Fachliche Fehler werden erst nach dem Transaktionsende als API-Antwort ausgegeben.
class ReservationError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Die Gerätesperre serialisiert Anlage, Terminänderung und Reaktivierung desselben Geräts.
// READ COMMITTED liefert nach einer Wartezeit den zuletzt bestätigten Reservierungsstand.
// Die echte Zeilensperre schützt gleichzeitig vor parallelen Gerätestatusänderungen.
async function lockInventoryItem(tx: Prisma.TransactionClient, id: string) {
  const items = await tx.$queryRaw<Array<{ id: string; status: string }>>`
    SELECT "id", "status" FROM "InventoryItem" WHERE "id" = ${id} FOR UPDATE
  `;
  const item = items[0];
  if (!item) throw new ReservationError(404, "Inventory item not found");
  return item;
}

// Andere bisher erlaubte Betriebszustände bleiben für zukünftige Buchungen zulässig.
function requireEligibleInventory(status: string) {
  if (["PENDING_REGISTRATION", "LOST", "RETIRED"].includes(status)) {
    throw new ReservationError(400, "Inventory item is not available for reservation");
  }
}

// Prüft, ob sich zwei Reservierungszeiträume überschneiden
async function hasReservationConflict(
  tx: Prisma.TransactionClient,
  inventoryItemId: string,
  startDate: Date,
  endDate: Date,
  excludeReservationId?: string,
) {
  const conflict = await tx.reservation.findFirst({
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

    const reservation = await prisma.$transaction(async (tx) => {
      // Alle Prüfungen und das Speichern verwenden dieselbe Verbindung und Transaktion.
      const event = await tx.event.findUnique({ where: { id: data.eventId } });
      if (!event) throw new ReservationError(404, "Event not found");

      const item = await lockInventoryItem(tx, data.inventoryItemId);
      requireEligibleInventory(item.status);

      // Die bestehende Datums- und Statussemantik bleibt auch bei stornierten Anlagen erhalten.
      if (await hasReservationConflict(tx, data.inventoryItemId, data.startDate, data.endDate)) {
        throw new ReservationError(409, "Inventory item is already reserved for this period");
      }

      return tx.reservation.create({
        data,
        include: {
          event: true,
          inventoryItem: { include: { product: true, warehouse: true } },
        },
      });
    }, { isolationLevel: "ReadCommitted" });

    return res.status(201).json(reservation);
  } catch (error) {
    if (error instanceof ReservationError) return res.status(error.status).json({ error: error.message });
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
        createdAt: "desc",
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

    const reservation = await prisma.$transaction(async (tx) => {
      // Die Gerätezuordnung ist über dieses API unveränderlich und dient nur zur Sperrauswahl.
      const reference = await tx.reservation.findUnique({ where: { id } });
      if (!reference) throw new ReservationError(404, "Reservation not found");
      const item = await lockInventoryItem(tx, reference.inventoryItemId);

      // Nach dem Warten erneut lesen, damit parallele Teiländerungen nicht verloren gehen.
      const existingReservation = await tx.reservation.findUnique({ where: { id } });
      if (!existingReservation) throw new ReservationError(404, "Reservation not found");
      const startDate = result.data.startDate ?? existingReservation.startDate;
      const endDate = result.data.endDate ?? existingReservation.endDate;
      if (endDate < startDate) {
        throw new ReservationError(400, "End date must not be before start date");
      }

      const newStatus = result.data.status ?? existingReservation.status;
      if (newStatus !== "CANCELLED") {
        // Reaktivierungen und Terminänderungen benötigen ein weiterhin zulässiges Gerät.
        // Reine Notizänderungen und Abschluss bestehender Vorgänge bleiben möglich.
        if (existingReservation.status === "CANCELLED" ||
            result.data.startDate !== undefined || result.data.endDate !== undefined ||
            (newStatus !== existingReservation.status && newStatus !== "COMPLETED")) {
          requireEligibleInventory(item.status);
        }
        if (await hasReservationConflict(tx, item.id, startDate, endDate, id)) {
          throw new ReservationError(409, "Inventory item is already reserved for this period");
        }
      }

      // Stornieren bleibt auch bei inzwischen verlorenen oder ausgemusterten Geräten möglich.
      return tx.reservation.update({
        where: { id },
        data: result.data,
        include: {
          event: true,
          inventoryItem: { include: { product: true, warehouse: true } },
        },
      });
    }, { isolationLevel: "ReadCommitted" });

    return res.json(reservation);
  } catch (error) {
    if (error instanceof ReservationError) return res.status(error.status).json({ error: error.message });
    console.error("Update reservation error:", error);

    return res.status(500).json({
      error: "Could not update reservation",
    });
  }
}
