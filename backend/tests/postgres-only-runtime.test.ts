import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/lib/prisma.js";

describe("PostgreSQL-only runtime", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("health endpoint reports PostgreSQL connectivity without MONGODB_URI", async () => {
    // Simuliere eine Umgebung ohne MongoDB-URI.
    const previous = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "nexus-events-api",
      database: "connected",
    });

    if (previous !== undefined) {
      process.env.MONGODB_URI = previous;
    }
  });

  it("does not import the legacy MongoDB config module from the server entry point", async () => {
    const fs = await import("node:fs/promises");
    const source = await fs.readFile(
      new URL("../src/server.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toMatch(/mongodb/i);
  });
});