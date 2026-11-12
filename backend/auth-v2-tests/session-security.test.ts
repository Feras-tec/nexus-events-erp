import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import request from "supertest";
import { authV2Prisma } from "../src/modules/auth-v2/prisma.js";
import { LoginRateLimiter } from "../src/modules/auth-v2/security.js";
import {
  BASE_PATH,
  ORIGIN,
  OWNER_ID,
  PASSWORD,
  buildApp,
  findSessionCookieLine,
  getSession,
  login,
  resetDb,
  seedUser,
} from "./helpers.js";

const limiter = new LoginRateLimiter({
  windowMs: 60_000,
  maxFailures: 3,
  blockMs: 60_000,
});
const { app } = buildApp({ router: { loginLimiter: limiter } });

beforeEach(async () => {
  await resetDb();
  await seedUser({
    id: OWNER_ID,
    email: "owner@spike.test",
    name: "Owner",
    role: "OWNER",
  });
  limiter.clear();
});

after(async () => {
  await authV2Prisma.$disconnect();
});

test("PASS: absolute expiration rejects and deletes the session", async () => {
  const { cookie } = await login(app, "owner@spike.test");
  assert.ok(cookie);
  const row = await authV2Prisma.session.findFirstOrThrow({
    where: { userId: OWNER_ID },
  });
  await authV2Prisma.session.update({
    where: { id: row.id },
    data: {
      createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const response = await request(app)
    .get(`${BASE_PATH}/account/me`)
    .set("Cookie", cookie!);
  assert.equal(response.status, 401, JSON.stringify(response.body));
  assert.equal(response.body.error, "ABSOLUTE_EXPIRED");
  assert.equal(
    await authV2Prisma.session.count({ where: { id: row.id } }),
    0,
  );
});

test("PASS: idle expiration rejects and deletes the session", async () => {
  const { cookie } = await login(app, "owner@spike.test");
  assert.ok(cookie);
  const row = await authV2Prisma.session.findFirstOrThrow({
    where: { userId: OWNER_ID },
  });
  await authV2Prisma.session.update({
    where: { id: row.id },
    data: {
      lastSeenAt: new Date(Date.now() - 31 * 60 * 1000),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const response = await request(app)
    .get(`${BASE_PATH}/account/me`)
    .set("Cookie", cookie!);
  assert.equal(response.status, 401, JSON.stringify(response.body));
  assert.equal(response.body.error, "IDLE_EXPIRED");
  assert.equal(
    await authV2Prisma.session.count({ where: { id: row.id } }),
    0,
  );
});

test("PASS: deactivation invalidates existing sessions on the next request", async () => {
  const { cookie } = await login(app, "owner@spike.test");
  assert.ok(cookie);

  await authV2Prisma.appUser.update({
    where: { id: OWNER_ID },
    data: { isActive: false },
  });

  const response = await request(app)
    .get(`${BASE_PATH}/account/me`)
    .set("Cookie", cookie!);
  assert.equal(response.status, 401, JSON.stringify(response.body));
  assert.equal(response.body.error, "ACCOUNT_INACTIVE");
  assert.equal(
    await authV2Prisma.session.count({ where: { userId: OWNER_ID } }),
    0,
  );
});

test("PASS: inactive accounts cannot create a session", async () => {
  await authV2Prisma.appUser.update({
    where: { id: OWNER_ID },
    data: { isActive: false },
  });

  const { res } = await login(app, "owner@spike.test");
  assert.notEqual(res.status, 200);
  assert.equal(
    await authV2Prisma.session.count({ where: { userId: OWNER_ID } }),
    0,
  );
});

test("PASS: the stored digest cannot be replayed as a session cookie", async () => {
  const { cookie } = await login(app, "owner@spike.test");
  assert.ok(cookie);
  const row = await authV2Prisma.session.findFirstOrThrow({
    where: { userId: OWNER_ID },
  });
  assert.match(row.token, /^v1:[0-9a-f]{64}$/);

  const replay = await getSession(app, `nexus.session_token=${row.token}`);
  assert.equal(replay.body, null);
  assert.doesNotMatch(JSON.stringify(replay.body), /v1:[0-9a-f]{64}/);
});

test("PASS: cross-site and origin-less state changes are rejected", async () => {
  const { cookie } = await login(app, "owner@spike.test");
  assert.ok(cookie);

  const crossed = await request(app)
    .post(`${BASE_PATH}/change-password`)
    .set("Origin", "https://evil.example")
    .set("Cookie", cookie!)
    .send({ currentPassword: PASSWORD, newPassword: "Attacker-Password-2026" });
  assert.equal(crossed.status, 403, JSON.stringify(crossed.body));

  const noOrigin = await request(app)
    .post(`${BASE_PATH}/change-password`)
    .set("Cookie", cookie!)
    .send({ currentPassword: PASSWORD, newPassword: "Attacker-Password-2026" });
  assert.equal(noOrigin.status, 403, JSON.stringify(noOrigin.body));

  // The session is still valid after the rejected requests.
  assert.equal((await getSession(app, cookie!)).body.user.id, OWNER_ID);
});

test("PASS: repeated failed logins are throttled per account and IP", async () => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const failed = await login(
      app,
      "owner@spike.test",
      "Wrong-Password-2026",
    );
    assert.equal(failed.res.status, 401, JSON.stringify(failed.res.body));
  }

  const blocked = await login(app, "owner@spike.test", PASSWORD);
  assert.equal(blocked.res.status, 429, JSON.stringify(blocked.res.body));
  assert.equal(blocked.res.body.scope, "account");
  assert.ok(Number(blocked.res.headers["retry-after"]) > 0);

  const otherIp = await request(app)
    .post(`${BASE_PATH}/sign-in/email`)
    .set("Origin", ORIGIN)
    .set("X-Forwarded-For", "198.51.100.20")
    .send({ email: "owner@spike.test", password: PASSWORD });
  assert.equal(otherIp.status, 200, JSON.stringify(otherIp.body));
});

test("PASS: secure cookie mode uses the __Secure- prefix and Secure attribute", async () => {
  const secure = buildApp({
    config: {
      baseURL: "https://app.nexus.test",
      trustedOrigins: ["https://app.nexus.test"],
      secureCookies: true,
    },
  });

  const { res, cookie } = await login(
    secure.app,
    "owner@spike.test",
    PASSWORD,
    "https://app.nexus.test",
  );
  assert.equal(res.status, 200, JSON.stringify(res.body));

  const line = findSessionCookieLine(res);
  assert.match(line, /^__Secure-nexus\.session_token=/);
  assert.match(line, /;\s*Secure/i);
  assert.match(line, /HttpOnly/i);
  assert.match(line, /SameSite=Lax/i);
  assert.doesNotMatch(line, /Domain=/i);

  const session = await getSession(secure.app, cookie!);
  assert.equal(session.status, 200, JSON.stringify(session.body));
  assert.equal(session.body.user.id, OWNER_ID);
});

test("PASS: a cookie from another database user's deleted session is rejected", async () => {
  const { cookie } = await login(app, "owner@spike.test");
  assert.ok(cookie);
  await authV2Prisma.session.deleteMany({ where: { userId: OWNER_ID } });
  const response = await getSession(app, cookie!);
  assert.equal(response.body, null);
});
