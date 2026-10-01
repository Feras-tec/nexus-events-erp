import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import {
  createEventSchema,
  updateEventSchema,
} from "../schemas/event.schema.js";

// Neues Event erstellen
export const createEvent = async (req: Request, res: Response) => {
  const result = createEventSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    // Prüfen, ob der Kunde existiert und aktiv ist
    const customer = await prisma.customer.findUnique({
      where: {
        id: result.data.customerId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    if (!customer.isActive) {
      return res.status(400).json({
        error: "Customer is inactive",
      });
    }

    const event = await prisma.event.create({
      data: result.data,
      include: {
        customer: true,
      },
    });

    return res.status(201).json({
      data: event,
    });
  } catch (error) {
    console.error("Create event error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Alle Events abrufen
export const getEvents = async (_req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        customer: true,
      },
      orderBy: {
        startDate: "asc",
      },
    });

    return res.status(200).json({
      data: events,
    });
  } catch (error) {
    console.error("Get events error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Ein Event anhand seiner ID abrufen
export const getEventById = async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const event = await prisma.event.findUnique({
      where: {
        id,
      },
      include: {
        customer: true,
      },
    });

    if (!event) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    return res.status(200).json({
      data: event,
    });
  } catch (error) {
    console.error("Get event error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Event-Daten teilweise aktualisieren
export const updateEvent = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const result = updateEventSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    const existingEvent = await prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!existingEvent) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    // Neue und bestehende Datumswerte gemeinsam prüfen
    const startDate = result.data.startDate ?? existingEvent.startDate;
    const endDate = result.data.endDate ?? existingEvent.endDate;

    if (endDate < startDate) {
      return res.status(400).json({
        error: "End date must not be before start date",
      });
    }

    const event = await prisma.event.update({
      where: {
        id,
      },
      data: result.data,
      include: {
        customer: true,
      },
    });

    return res.status(200).json({
      data: event,
    });
  } catch (error) {
    console.error("Update event error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
