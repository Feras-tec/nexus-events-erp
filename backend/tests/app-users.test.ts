import type { Request, Response } from "express";
import { jest } from "@jest/globals";

const mockFindMany = jest.fn<(...args: any[]) => Promise<any>>();
const mockFindUnique = jest.fn<(...args: any[]) => Promise<any>>();
const mockUpdate = jest.fn<(...args: any[]) => Promise<any>>();

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: {
    appUser: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

const { getAppUsers, updateAppUser } =
  await import("../src/controllers/app-user.controller.js");

function createResponse() {
  const json = jest.fn();
  const status = jest.fn().mockImplementation(() => ({ json }));

  return {
    res: { status } as unknown as Response,
    status,
    json,
  };
}

describe("App User Management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sollte Benutzer auflisten", async () => {
    mockFindMany.mockResolvedValue([
      { id: "user-1", role: "EMPLOYEE" },
    ]);

    const { res, status, json } = createResponse();

    await getAppUsers({} as Request, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      users: [{ id: "user-1", role: "EMPLOYEE" }],
    });
  });

  it("sollte OWNER vor Änderungen schützen", async () => {
    mockFindUnique.mockResolvedValue({
      id: "owner-1",
      role: "OWNER",
    });

    const { res, status } = createResponse();

    await updateAppUser(
      {
        params: { id: "owner-1" },
        body: { isActive: false },
      } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("sollte das Vergeben der OWNER-Rolle verhindern", async () => {
    const { res, status } = createResponse();

    await updateAppUser(
      {
        params: { id: "user-1" },
        body: { role: "OWNER" },
      } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("sollte ungültige Daten ablehnen", async () => {
    const { res, status } = createResponse();

    await updateAppUser(
      {
        params: { id: "user-1" },
        body: { isActive: "false" },
      } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("sollte erlaubte Rollenänderungen durchführen", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      role: "EMPLOYEE",
    });

    mockUpdate.mockResolvedValue({
      id: "user-1",
      role: "ADMIN",
      isActive: true,
    });

    const { res, status, json } = createResponse();

    await updateAppUser(
      {
        params: { id: "user-1" },
        body: { role: "ADMIN" },
      } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      user: {
        id: "user-1",
        role: "ADMIN",
        isActive: true,
      },
    });
  });
});
