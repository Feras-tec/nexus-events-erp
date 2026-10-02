import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/lib/prisma.js";

describe("RBAC-Schutz", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("sollte nicht authentifizierte Benutzer ablehnen", async () => {
    const response = await request(app).get("/api/companies");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: "Unauthorized",
    });
  });
});
