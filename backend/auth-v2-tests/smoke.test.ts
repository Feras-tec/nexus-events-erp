import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import request from "supertest";
import { authV2Prisma } from "../src/modules/auth-v2/prisma.js";
import {
  BASE_PATH,
  ORIGIN,
  OWNER_ID,
  buildApp,
  extractCookie,
  findSessionCookieLine,
  getSession,
  login,
  resetDb,
  seedUser,
  setCookieLines,
} from "./helpers.js";

const { app } = buildApp();

before(async () => {
  await resetDb();
  await seedUser({
    id: OWNER_ID,
    email: "owner@spike.test",
    name: "Owner",
    role: "OWNER",
    clerkUserId: "clerk_legacy_owner",
  });
});

after(async () => {
  await authV2Prisma.$disconnect();
});

test("PASS: login works and the session token is hashed at rest", async () => {
  const { res, cookie, token } = await login(app, "owner@spike.test");
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.ok(cookie, JSON.stringify(setCookieLines(res)));
  assert.ok(token);
  assert.match(token!, /^[A-Za-z0-9]{32}$/);

  const rows = await authV2Prisma.session.findMany({
    where: { userId: OWNER_ID },
  });
  assert.equal(rows.length, 1);
  assert.match(rows[0]!.token, /^v1:[0-9a-f]{64}$/);
  assert.notEqual(rows[0]!.token, token);
});

test("PASS: the cookie is HttpOnly, SameSite=Lax, host-only and Path=/", async () => {
  const { res } = await login(app, "owner@spike.test");
  const line = findSessionCookieLine(res);
  assert.match(line, /HttpOnly/i);
  assert.match(line, /SameSite=Lax/i);
  assert.match(line, /Path=\//);
  assert.doesNotMatch(line, /Domain=/i);
  assert.ok(extractCookie(res).length > 0);
});

test("PASS: get-session and account/me return the authenticated user", async () => {
  const { cookie } = await login(app, "owner@spike.test");
  assert.ok(cookie);

  const session = await getSession(app, cookie!);
  assert.equal(session.status, 200, JSON.stringify(session.body));
  assert.equal(session.body.user.id, OWNER_ID);

  const me = await request(app)
    .get(`${BASE_PATH}/account/me`)
    .set("Cookie", cookie!);
  assert.equal(me.status, 200, JSON.stringify(me.body));
  assert.equal(me.body.user.role, "OWNER");
  assert.equal(me.body.user.email, "owner@spike.test");
});

test("PASS: unauthenticated account request is rejected", async () => {
  const me = await request(app).get(`${BASE_PATH}/account/me`);
  assert.equal(me.status, 401);
  assert.equal(me.body.error, "UNAUTHENTICATED");
});

test("PASS: public self-registration is still disabled", async () => {
  const beforeCount = await authV2Prisma.appUser.count();
  const signUp = await request(app)
    .post(`${BASE_PATH}/sign-up/email`)
    .set("Origin", ORIGIN)
    .send({
      email: "attacker@spike.test",
      password: "Attacker-Password-2026",
      name: "Attacker",
    });
  assert.notEqual(signUp.status, 200);
  assert.equal(await authV2Prisma.appUser.count(), beforeCount);
});

test("PASS: the auth-v2 health endpoint is isolated under its own prefix", async () => {
  const health = await request(app).get(`${BASE_PATH}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(health.body, { status: "ready", module: "auth-v2" });
});
