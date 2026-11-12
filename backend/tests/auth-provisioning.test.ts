import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

const mockGetAuth = jest.fn<(...args: any[]) => any>();
const mockGetUser = jest.fn<(...args: any[]) => Promise<any>>();
const mockFindUnique = jest.fn<(...args: any[]) => Promise<any>>();
const mockUpsert = jest.fn<(...args: any[]) => Promise<any>>();

jest.unstable_mockModule("@clerk/express", () => ({
  getAuth: mockGetAuth,
  clerkClient: {
    users: {
      getUser: mockGetUser,
    },
  },
}));

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: {
    appUser: {
      findUnique: mockFindUnique,
      upsert: mockUpsert,
    },
  },
}));

const { default: authRouter } = await import(
  "../src/routes/auth.routes.js"
);

function createApp() {
  const app = express();

  app.use(express.json());
  app.use("/api/auth", authRouter);

  return app;
}

function clerkUser(email = "new.user@example.com") {
  return {
    primaryEmailAddressId: "email-1",
    emailAddresses: [
      {
        id: "email-1",
        emailAddress: email,
      },
    ],
  };
}

describe("Clerk-Benutzerbereitstellung", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetAuth.mockReturnValue({
      isAuthenticated: true,
      userId: "clerk-user-1",
    });

    mockGetUser.mockResolvedValue(clerkUser());
  });

  it("legt neue Benutzer inaktiv an", async () => {
    mockUpsert.mockResolvedValue({
      id: "app-user-1",
      clerkUserId: "clerk-user-1",
      role: "EMPLOYEE",
      isActive: false,
    });

    const response = await request(createApp()).get(
      "/api/auth/me",
    );

    expect(response.status).toBe(200);

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { clerkUserId: "clerk-user-1" },
      update: { email: "new.user@example.com" },
      create: {
        clerkUserId: "clerk-user-1",
        email: "new.user@example.com",
        role: "EMPLOYEE",
        isActive: false,
      },
    });

    expect(response.body.user).toMatchObject({
      role: "EMPLOYEE",
      isActive: false,
    });
  });

  it("lässt Rolle und Freigabestatus bestehender Benutzer unverändert", async () => {
    mockUpsert.mockResolvedValue({
      id: "app-user-2",
      clerkUserId: "clerk-user-1",
      role: "ADMIN",
      isActive: true,
    });

    const response = await request(createApp()).get(
      "/api/auth/me",
    );

    expect(response.status).toBe(200);

    const upsertArgs = mockUpsert.mock.calls[0]?.[0];

    expect(upsertArgs.update).toEqual({
      email: "new.user@example.com",
    });

    expect(upsertArgs.update).not.toHaveProperty("role");
    expect(upsertArgs.update).not.toHaveProperty("isActive");

    expect(response.body.user).toMatchObject({
      role: "ADMIN",
      isActive: true,
    });
  });
});
