import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/lib/prisma.js";

describe("GET /health", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("sollte API und Datenbank als erreichbar melden", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "nexus-events-api",
      database: "connected",
    });
  });
});
