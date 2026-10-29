import type { Request, Response } from "express";
import { jest } from "@jest/globals";

const mockEventFindUnique = jest.fn<() => Promise<{ id: string } | null>>();

const mockReservationFindFirst =
  jest.fn<() => Promise<{ id: string } | null>>();

const mockReservationCreate = jest.fn<() => Promise<{ id: string }>>();

const tx = {
  event: {
    findUnique: mockEventFindUnique,
  },
  reservation: {
    findFirst: mockReservationFindFirst,
    create: mockReservationCreate,
  },
  $queryRaw: jest.fn<() => Promise<Array<{ id: string; status: string }>>>(),
};

// Die Transaktion wird ohne externe Datenbank ausgeführt; echte Sperren prüfen separate Integrationstests.
jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: { $transaction: async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx) },
}));

const { createReservation } =
  await import("../src/controllers/reservation.controller.js");

describe("Reservation Conflict", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    tx.$queryRaw.mockResolvedValue([{ id: "22222222-2222-4222-8222-222222222222", status: "AVAILABLE" }]);
  });

  it("sollte eine überlappende Reservierung ablehnen", async () => {
    mockEventFindUnique.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
    });

    // Eine bestehende Reservierung überschneidet sich mit dem Zeitraum
    mockReservationFindFirst.mockResolvedValue({
      id: "44444444-4444-4444-8444-444444444444",
    });

    const req = {
      body: {
        startDate: "2026-11-12T10:00:00.000Z",
        endDate: "2026-11-12T18:00:00.000Z",
        status: "CONFIRMED",
        eventId: "11111111-1111-4111-8111-111111111111",
        inventoryItemId: "22222222-2222-4222-8222-222222222222",
      },
    } as Request;

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    const res = {
      status,
    } as unknown as Response;

    await createReservation(req, res);

    expect(mockReservationFindFirst).toHaveBeenCalled();

    expect(status).toHaveBeenCalledWith(409);

    expect(json).toHaveBeenCalledWith({
      error: "Inventory item is already reserved for this period",
    });

    // Bei einem Konflikt darf keine neue Reservierung gespeichert werden
    expect(mockReservationCreate).not.toHaveBeenCalled();
  });

  it("sollte eine Reservierung erlauben, wenn kein aktiver Konflikt existiert", async () => {
    mockEventFindUnique.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
    });

    // Keine aktive Reservierung blockiert diesen Zeitraum
    mockReservationFindFirst.mockResolvedValue(null);

    const createdReservation = {
      id: "55555555-5555-4555-8555-555555555555",
    };

    mockReservationCreate.mockResolvedValue(createdReservation);

    const req = {
      body: {
        startDate: "2026-11-12T10:00:00.000Z",
        endDate: "2026-11-12T18:00:00.000Z",
        status: "CONFIRMED",
        eventId: "11111111-1111-4111-8111-111111111111",
        inventoryItemId: "22222222-2222-4222-8222-222222222222",
      },
    } as Request;

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    const res = {
      status,
    } as unknown as Response;

    await createReservation(req, res);

    expect(mockReservationFindFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: {
          not: "CANCELLED",
        },
      }),
    });

    expect(mockReservationCreate).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(createdReservation);
  });
});

// Jeder gesperrte Gerätestatus muss denselben bisherigen Fehlervertrag liefern.
describe.each(["PENDING_REGISTRATION", "LOST", "RETIRED"])("Unzulässiger Gerätestatus %s", (status) => {
  it("verhindert das Anlegen einer Reservierung", async () => {
    mockEventFindUnique.mockResolvedValue({ id: "11111111-1111-4111-8111-111111111111" });
    tx.$queryRaw.mockResolvedValue([{ id: "22222222-2222-4222-8222-222222222222", status }]);
    mockReservationCreate.mockClear();
    const json = jest.fn();
    const responseStatus = jest.fn(() => ({ json }));
    await createReservation({ body: {
      startDate: "2026-11-12T10:00:00.000Z", endDate: "2026-11-12T18:00:00.000Z",
      eventId: "11111111-1111-4111-8111-111111111111",
      inventoryItemId: "22222222-2222-4222-8222-222222222222",
    } } as Request, { status: responseStatus } as unknown as Response);
    expect(responseStatus).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: "Inventory item is not available for reservation" });
    expect(mockReservationCreate).not.toHaveBeenCalled();
  });
});
