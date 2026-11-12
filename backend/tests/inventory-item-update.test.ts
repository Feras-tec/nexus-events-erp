import type { Request, Response } from "express";
import { jest } from "@jest/globals";

const ITEM_ID = "55555555-5555-4555-8555-555555555555";

const mockFindUnique = jest.fn<(...args: any[]) => Promise<any>>();
const mockUpdate = jest.fn<(...args: any[]) => Promise<any>>();

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: {
    inventoryItem: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

const { updateInventoryItem } = await import(
  "../src/controllers/inventory-item.controller.js"
);

function createResponse() {
  const json = jest.fn();
  const status = jest.fn().mockImplementation(() => ({ json }));

  return {
    res: { status, json } as unknown as Response,
    status,
    json,
  };
}

describe("Generisches Lagerartikel-Update", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFindUnique.mockResolvedValue({
      id: ITEM_ID,
      status: "AVAILABLE",
      warehouseId: "66666666-6666-4666-8666-666666666666",
    });

    mockUpdate.mockResolvedValue({
      id: ITEM_ID,
      status: "AVAILABLE",
      location: "Halle 2",
    });
  });

  it("ignoriert Status- und Lagerortänderungen über PATCH", async () => {
    const { res, status } = createResponse();

    await updateInventoryItem(
      {
        params: { id: ITEM_ID },
        body: {
          status: "DAMAGED",
          warehouseId: "77777777-7777-4777-8777-777777777777",
          location: "Halle 2",
        },
      } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(200);

    const updateArgs = mockUpdate.mock.calls[0]?.[0];

    expect(updateArgs.data).toEqual({
      location: "Halle 2",
    });

    expect(updateArgs.data).not.toHaveProperty("status");
    expect(updateArgs.data).not.toHaveProperty("warehouseId");
  });

  it("erlaubt weiterhin rein beschreibende Standortänderungen", async () => {
    const { res, status } = createResponse();

    await updateInventoryItem(
      {
        params: { id: ITEM_ID },
        body: {
          location: "Lagerhalle Süd",
        },
      } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { location: "Lagerhalle Süd" },
      }),
    );
  });
});
