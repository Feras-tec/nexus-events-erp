import express, { type Request } from "express";
import { jest } from "@jest/globals";
import request from "supertest";
// Der Test-Verifizierer akzeptiert ausschließlich feste Token-Fixtures; beliebige Header bleiben untrusted.
const verifiedIdentities = new WeakMap<Request, string>();
const mockGetAuth = jest.fn((req: Request) => ({
  isAuthenticated: verifiedIdentities.has(req), userId: verifiedIdentities.get(req) ?? null,
}));
jest.unstable_mockModule("@clerk/express", () => ({ getAuth: mockGetAuth }));
const { configureRequestLimits, configureAccountLimits, getTrustedProxyHops, REQUEST_LIMIT_POLICY } =
  await import("../src/middleware/request-limits.js");

// Echte Express-IP-Ermittlung und echte Limiter testen, ohne Clerk oder Datenbankzugriffe.
type TestOptions = NonNullable<Parameters<typeof configureRequestLimits>[1]>;
function createApp(proxyHops = 1, overrides: TestOptions = {}) {
  const app = express();
  const options: TestOptions = {
    proxyHops, windowMs: 60_000, ipLimit: 100,
    ipScopes: { read: 100, write: 100, auth: 100, expensive: 100 },
    userScopes: { read: 2, write: 2, auth: 2, expensive: 2 },
    anonymousScopes: { read: 2, write: 2, auth: 2, expensive: 2 },
    ...overrides,
  };
  configureRequestLimits(app, options);
  app.use((req, _res, next) => {
    const tokens: Record<string, string> = { "Bearer fixture-A": "user-A", "Bearer fixture-A-other-session": "user-A", "Bearer fixture-B": "user-B" };
    const user = tokens[req.get("Authorization") ?? ""];
    if (user) verifiedIdentities.set(req, user);
    next();
  });
  configureAccountLimits(app, options);
  app.get("/health", (_req, res) => { res.json({ status: "ok" }); });
  app.get("/api/auth/me", (req, res) => { res.json({ ip: req.ip }); });
  app.get("/api/items", (req, res) => { res.json({ ip: req.ip }); });
  app.post("/api/items", (_req, res) => { res.status(201).json({ created: true }); });
  app.post("/api/quotes/:id/send-email", (_req, res) => { res.json({ sent: true }); });
  app.post("/api/invoices/:id/send-email", (_req, res) => { res.json({ sent: true }); });
  app.post("/api/inventory-items/bulk-generate", (_req, res) => { res.json({ generated: true }); });
  return app;
}

describe("Proxy-Konfiguration", () => {
  it("vertraut ohne Konfiguration keinem Proxy", () => {
    expect(getTrustedProxyHops("0")).toBe(0);
    const previous = process.env.TRUST_PROXY_HOPS;
    try {
      delete process.env.TRUST_PROXY_HOPS;
      expect(getTrustedProxyHops()).toBe(0);
    } finally {
      if (previous === undefined) delete process.env.TRUST_PROXY_HOPS;
      else process.env.TRUST_PROXY_HOPS = previous;
    }
  });

  it.each(["true", "false", "-1", "1.5", "", "1foo", "9007199254740992"])("verwirft unsichere oder ungültige Konfiguration %s", value => {
    expect(() => getTrustedProxyHops(value)).toThrow("TRUST_PROXY_HOPS");
  });

  it("liest die explizite Umgebungsvariable auch beim Einrichten der Anwendung", () => {
    const previous = process.env.TRUST_PROXY_HOPS;
    try {
      process.env.TRUST_PROXY_HOPS = "1";
      const app = express();
      configureRequestLimits(app);
      expect(app.get("trust proxy")).toBe(1);
    } finally {
      if (previous === undefined) delete process.env.TRUST_PROXY_HOPS;
      else process.env.TRUST_PROXY_HOPS = previous;
    }
  });

  it("ermittelt bei einem vertrauten Hop den rechten Forwarded-Eintrag", async () => {
    const response = await request(createApp()).get("/api/items")
      .set("X-Forwarded-For", "198.51.100.99, 203.0.113.10");
    expect(response.status).toBe(200);
    expect(response.body.ip).toBe("203.0.113.10");
  });

  it("ignoriert Forwarding-Header bei direktem Betrieb ohne Proxy-Vertrauen", async () => {
    const app = createApp(0);
    const first = await request(app).get("/api/items").set("X-Forwarded-For", "203.0.113.1");
    expect(first.body.ip).not.toBe("203.0.113.1");
    await request(app).get("/api/items").set("X-Forwarded-For", "203.0.113.2");
    expect((await request(app).get("/api/items").set("X-Forwarded-For", "203.0.113.3")).status).toBe(429);
  });
});

describe("Getrennte Rate-Limit-Budgets", () => {
  it("sperrt verschiedene Client-IPs hinter demselben Proxy nicht gemeinsam", async () => {
    const app = createApp();
    for (let i = 0; i < 2; i++) {
      expect((await request(app).get("/api/items").set("X-Forwarded-For", "203.0.113.1")).status).toBe(200);
    }
    expect((await request(app).get("/api/items").set("X-Forwarded-For", "203.0.113.1")).status).toBe(429);
    expect((await request(app).get("/api/items").set("X-Forwarded-For", "203.0.113.2")).status).toBe(200);
  });

  it("lässt das Limit nicht durch wechselnde linke Forwarded-Einträge umgehen", async () => {
    const app = createApp();
    for (const prefix of ["198.51.100.1", "198.51.100.2"]) {
      await request(app).get("/api/items").set("X-Forwarded-For", `${prefix}, 203.0.113.1`);
    }
    const response = await request(app).get("/api/items").set("X-Forwarded-For", "198.51.100.3, 203.0.113.1");
    expect(response.status).toBe(429);
  });

  it("zählt Health-Checks weder zum Auth- noch zum API-Budget", async () => {
    const app = createApp();
    for (let i = 0; i < 5; i++) expect((await request(app).get("/health")).status).toBe(200);
    expect((await request(app).get("/api/auth/me")).status).toBe(200);
    expect((await request(app).get("/api/items")).status).toBe(200);
    await request(app).get("/api/items");
    expect((await request(app).get("/api/items")).status).toBe(429);
    expect((await request(app).get("/health")).status).toBe(200);
  });

  it("begrenzt /auth/me separat und kennzeichnet Anwendungssperren eindeutig", async () => {
    const app = createApp();
    for (let i = 0; i < 2; i++) await request(app).get("/api/auth/me");
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(429);
    expect(Number(response.headers["retry-after"])).toBeGreaterThan(0);
    expect(response.headers["ratelimit"]).toBeDefined();
    expect(response.headers["x-ratelimit-source"]).toBe("nexus-events-api");
    expect(response.body).toEqual({ error: "Too many requests, please try again later.", code: "RATE_LIMITED", scope: "auth", layer: "anonymous" });
    expect((await request(app).get("/api/items")).status).toBe(200);
  });

  it("begrenzt Schreibzugriffe weiterhin und lässt /auth/me trotz API-Sperre zu", async () => {
    const app = createApp();
    expect((await request(app).post("/api/items")).status).toBe(201);
    expect((await request(app).post("/api/items")).status).toBe(201);
    const blocked = await request(app).post("/api/items");
    expect(blocked.status).toBe(429);
    expect(blocked.body.scope).toBe("write");
    expect((await request(app).get("/api/auth/me")).status).toBe(200);
  });

  it("wendet die Trennung auch bei Großschreibung und Query-Parametern an", async () => {
    const app = createApp();
    await request(app).get("/API/AUTH/me?check=1");
    await request(app).get("/api/auth/me");
    expect((await request(app).get("/api/auth/me")).status).toBe(429);
    expect((await request(app).get("/api/items")).status).toBe(200);
  });

  it("behält die IPv6-Subnetzbegrenzung bei", async () => {
    const app = createApp();
    await request(app).get("/api/items").set("X-Forwarded-For", "2001:db8:abcd:1200::1");
    await request(app).get("/api/items").set("X-Forwarded-For", "2001:db8:abcd:1200::2");
    expect((await request(app).get("/api/items").set("X-Forwarded-For", "2001:db8:abcd:1200::3")).status).toBe(429);
    expect((await request(app).get("/api/items").set("X-Forwarded-For", "2001:db8:abce::1")).status).toBe(200);
  });
});

// Kontolimits laufen über dieselbe Middleware-Reihenfolge wie in app.ts: IP, Verifizierung, Konto, Route.
describe("Verifizierte Benutzerbudgets", () => {
  it("trennt zwei verifizierte Benutzer hinter derselben öffentlichen IP", async () => {
    const app = createApp();
    await request(app).get("/api/items").auth("fixture-A", { type: "bearer" });
    await request(app).get("/api/items").auth("fixture-A", { type: "bearer" });
    const denied = await request(app).get("/api/items").auth("fixture-A", { type: "bearer" });
    expect(denied.status).toBe(429);
    expect(denied.body).toMatchObject({ scope: "read", layer: "user" });
    expect((await request(app).get("/api/items").auth("fixture-B", { type: "bearer" })).status).toBe(200);
  });

  it("hält das Benutzerbudget bei IP- und Sitzungswechseln zusammen", async () => {
    const app = createApp();
    await request(app).get("/api/items").auth("fixture-A", { type: "bearer" }).set("X-Forwarded-For", "203.0.113.1");
    await request(app).get("/api/items").auth("fixture-A-other-session", { type: "bearer" }).set("X-Forwarded-For", "203.0.113.2");
    const denied = await request(app).get("/api/items").auth("fixture-A", { type: "bearer" }).set("X-Forwarded-For", "203.0.113.3");
    expect(denied.status).toBe(429);
    expect(denied.body.layer).toBe("user");
  });

  it("trennt Lese-, Schreib-, Auth- und teure Kontobudgets", async () => {
    const app = createApp();
    for (let i = 0; i < 2; i++) await request(app).get("/api/items").auth("fixture-A", { type: "bearer" });
    expect((await request(app).get("/api/items").auth("fixture-A", { type: "bearer" })).status).toBe(429);
    expect((await request(app).post("/api/items").auth("fixture-A", { type: "bearer" })).status).toBe(201);
    expect((await request(app).get("/api/auth/me").auth("fixture-A", { type: "bearer" })).status).toBe(200);
    expect((await request(app).post("/api/quotes/quote-1/send-email").auth("fixture-A", { type: "bearer" })).status).toBe(200);
  });

  it("lässt ein Konto trotz freiem IP-Budget nicht unbegrenzt schreiben", async () => {
    const app = createApp();
    for (let i = 0; i < 2; i++) await request(app).post("/api/items").auth("fixture-A", { type: "bearer" });
    const denied = await request(app).post("/api/items").auth("fixture-A", { type: "bearer" });
    expect(denied.status).toBe(429);
    expect(denied.body).toMatchObject({ scope: "write", layer: "user" });
    expect((await request(app).get("/api/auth/me").auth("fixture-A", { type: "bearer" })).status).toBe(200);
  });

  it("begrenzt Auth-Aufrufe auch für gültige Konten", async () => {
    const app = createApp();
    for (let i = 0; i < 2; i++) await request(app).get("/api/auth/me").auth("fixture-A", { type: "bearer" });
    const denied = await request(app).get("/api/auth/me").auth("fixture-A", { type: "bearer" });
    expect(denied.status).toBe(429);
    expect(denied.body).toMatchObject({ scope: "auth", layer: "user" });
    expect((await request(app).get("/api/items").auth("fixture-A", { type: "bearer" })).status).toBe(200);
  });

  it("teilt das teure Budget zwischen allen E-Mail- und Barcode-Endpunkten", async () => {
    const app = createApp();
    expect((await request(app).post("/api/quotes/one/send-email").auth("fixture-A", { type: "bearer" })).status).toBe(200);
    expect((await request(app).post("/API/INVOICES/two/send-email/?retry=1").auth("fixture-A", { type: "bearer" })).status).toBe(200);
    const denied = await request(app).post("/api/inventory-items/bulk-generate").auth("fixture-A", { type: "bearer" });
    expect(denied.status).toBe(429);
    expect(denied.body).toMatchObject({ scope: "expensive", layer: "user" });
    expect((await request(app).post("/api/items").auth("fixture-A", { type: "bearer" })).status).toBe(201);
  });

  it("verwendet keine frei behaupteten Benutzer-IDs oder selbstgebauten JWTs", async () => {
    const app = createApp();
    for (const fake of ["user-A", "user-B", "user-C"]) {
      const response = await request(app).get("/api/items")
        .set("X-User-ID", fake).set("X-Clerk-User-Id", fake)
        .set("Cookie", `userId=${fake}`).set("Authorization", `Bearer eyJhbGciOiJub25lIn0.${fake}.`);
      expect(response.status).toBe(fake === "user-C" ? 429 : 200);
      if (response.status === 429) expect(response.body.layer).toBe("anonymous");
    }
    expect(mockGetAuth).toHaveBeenCalledWith(expect.anything(), { acceptsToken: "session_token" });
  });

  it("lässt das anonyme Budget nicht durch Benutzer-IDs im Body umgehen", async () => {
    const app = createApp();
    for (const userId of ["A", "B"]) await request(app).post("/api/items").send({ userId, clerkUserId: userId });
    const denied = await request(app).post("/api/items").send({ userId: "C" });
    expect(denied.status).toBe(429);
    expect(denied.body.layer).toBe("anonymous");
  });

  it("begrenzt die gemeinsame IP auch beim Wechsel gültiger Benutzer", async () => {
    const app = createApp(1, { ipLimit: 2 });
    await request(app).get("/api/items").auth("fixture-A", { type: "bearer" });
    await request(app).get("/api/items").auth("fixture-B", { type: "bearer" });
    const denied = await request(app).get("/api/auth/me").auth("fixture-B", { type: "bearer" });
    expect(denied.status).toBe(429);
    expect(denied.body).toMatchObject({ scope: "all", layer: "ip" });
    expect((await request(app).get("/health")).status).toBe(200);
  });

  it("stoppt eine IP-Flut bereits vor der Clerk-Verifizierung", async () => {
    const app = createApp(1, { ipLimit: 1 });
    mockGetAuth.mockClear();
    await request(app).get("/api/items").auth("fixture-A", { type: "bearer" });
    expect(mockGetAuth).toHaveBeenCalledTimes(1);
    const denied = await request(app).get("/api/items").auth("fixture-B", { type: "bearer" });
    expect(denied.status).toBe(429);
    expect(mockGetAuth).toHaveBeenCalledTimes(1);
  });

  it("hält IP-Grenzen für Auth und teure Operationen getrennt", async () => {
    const app = createApp(1, { ipScopes: { auth: 1, expensive: 1 } });
    await request(app).get("/api/auth/me").auth("fixture-A", { type: "bearer" });
    const authDenied = await request(app).get("/api/auth/me").auth("fixture-B", { type: "bearer" });
    expect(authDenied.body).toMatchObject({ scope: "auth", layer: "ip" });
    await request(app).post("/api/quotes/one/send-email").auth("fixture-A", { type: "bearer" });
    const expensiveDenied = await request(app).post("/api/inventory-items/bulk-generate").auth("fixture-B", { type: "bearer" });
    expect(expensiveDenied.body).toMatchObject({ scope: "expensive", layer: "ip" });
    expect((await request(app).get("/api/items").auth("fixture-B", { type: "bearer" })).status).toBe(200);
  });

  it("gewährt Anonymen nicht das höhere Budget angemeldeter Nutzer", async () => {
    const app = createApp(1, { userScopes: { read: 4 }, anonymousScopes: { read: 1 } });
    await request(app).get("/api/items");
    expect((await request(app).get("/api/items")).status).toBe(429);
    for (let i = 0; i < 4; i++) {
      expect((await request(app).get("/api/items").auth("fixture-A", { type: "bearer" })).status).toBe(200);
    }
    expect((await request(app).get("/api/items").auth("fixture-A", { type: "bearer" })).status).toBe(429);
  });

  it("erlaubt mit der Produktionspolicy deutlich mehr als die bisherigen 150 Lesezugriffe", async () => {
    const app = createApp(1, REQUEST_LIMIT_POLICY);
    for (let i = 0; i < 160; i++) {
      expect((await request(app).get("/api/items").auth("fixture-A", { type: "bearer" })).status).toBe(200);
    }
  });

  it("setzt das endliche Budget nach Ablauf des Fensters zurück", async () => {
    const app = createApp(1, { windowMs: 200, userScopes: { read: 1 } });
    await request(app).get("/api/items").auth("fixture-A", { type: "bearer" });
    expect((await request(app).get("/api/items").auth("fixture-A", { type: "bearer" })).status).toBe(429);
    await new Promise(resolve => setTimeout(resolve, 250));
    expect((await request(app).get("/api/items").auth("fixture-A", { type: "bearer" })).status).toBe(200);
  });

  it.each([0, -1, Infinity, NaN, 1.5])("verhindert unbegrenzte oder ungültige Budgets %s", limit => {
    expect(() => createApp(1, { userScopes: { read: limit } })).toThrow("positive finite integers");
    expect(() => createApp(1, { ipLimit: limit })).toThrow("positive finite integers");
  });
});

// Anbieterwahl erfolgt ausschließlich pro Prozess, niemals über ein fremdes Cookie.
it("ignores Auth-V2 cookies in explicit Clerk fallback quota resolution", async () => {
 const app=createApp();
 for(let i=0;i<2;i++)expect((await request(app).get('/api/items').auth('fixture-A',{type:'bearer'}).set('Cookie','nexus.session_token=other-provider')).status).toBe(200);
 const limited=await request(app).get('/api/items').auth('fixture-A',{type:'bearer'}).set('Cookie','nexus.session_token=changed');
 expect(limited.status).toBe(429);expect(limited.body.layer).toBe('user');
 expect((await request(app).get('/api/items').auth('fixture-B',{type:'bearer'}).set('Cookie','nexus.session_token=other-provider')).status).toBe(200);
});
