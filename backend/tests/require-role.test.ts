import type { Request, Response, NextFunction } from "express";
import { jest } from "@jest/globals";

const mockGetAuth = jest.fn();
const mockFindUnique = jest.fn();

jest.unstable_mockModule("@clerk/express", () => ({
  getAuth: mockGetAuth,
}));

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: {
    appUser: {
      findUnique: mockFindUnique,
    },
  },
}));

const { requireRole } = await import("../src/middleware/require-role.js");

describe("requireRole Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sollte Benutzer mit nicht erlaubter Rolle ablehnen", async () => {
    mockGetAuth.mockReturnValue({
      isAuthenticated: true,
      userId: "test-user",
    });

    mockFindUnique.mockResolvedValue({
      clerkUserId: "test-user",
      role: "EMPLOYEE",
      isActive: true,
    });

    const req = {} as Request;

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    const res = {
      status,
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    const middleware = requireRole("OWNER", "ADMIN");

    await middleware(req, res, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      error: "Insufficient permissions",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
