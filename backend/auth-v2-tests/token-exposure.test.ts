import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import request from "supertest";
import { hash } from "@node-rs/argon2";
import { ARGON2_OPTIONS } from "../src/modules/auth-v2/config.js";
import { authV2Prisma } from "../src/modules/auth-v2/prisma.js";
import {
  BASE_PATH,
  NEW_PASSWORD,
  ORIGIN,
  OWNER_ID,
  PASSWORD,
  buildApp,
  extractCookie,
  getSession,
  listSessions,
  login,
  resetDb,
  seedUser,
} from "./helpers.js";

const { app } = buildApp();

before(async () => {
  await resetDb();
  await seedUser({
    id: OWNER_ID,
    email: "owner@spike.test",
    name: "Owner",
    role: "OWNER",
  });
});

beforeEach(async () => {
  await authV2Prisma.session.deleteMany();
  await authV2Prisma.account.updateMany({
    data: { password: await hash(PASSWORD, ARGON2_OPTIONS) },
  });
});

after(async () => {
  await authV2Prisma.$disconnect();
});

test("PASS: sign-in/email never exposes the raw session token in JSON", async () => {
  const { res, token } = await login(app, "owner@spike.test");
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.ok(token);
  assert.equal(Object.hasOwn(res.body, "token"), false);
  assert.doesNotMatch(JSON.stringify(res.body), /"token"/);
  assert.ok(!JSON.stringify(res.body).includes(token!));
});

test("PASS: get-session never exposes the session token", async () => {
  const { cookie, token } = await login(app, "owner@spike.test");
  assert.ok(cookie && token);

  const response = await getSession(app, cookie!);
  assert.equal(response.status, 200, JSON.stringify(response.body));
  const body = JSON.stringify(response.body);
  assert.doesNotMatch(body, /"token"/);
  assert.ok(!body.includes(token!));
  assert.equal(response.body.user.id, OWNER_ID);
});

test("PASS: list-sessions never exposes any session token", async () => {
  const first = await login(app, "owner@spike.test");
  const second = await login(app, "owner@spike.test");
  assert.ok(first.cookie && first.token && second.token);

  const response = await listSessions(app, first.cookie!);
  assert.equal(response.status, 200, JSON.stringify(response.body));
  const body = JSON.stringify(response.body);
  assert.doesNotMatch(body, /"token"/);
  assert.ok(!body.includes(first.token!));
  assert.ok(!body.includes(second.token!));

  // Our own /sessions endpoint is also token-free.
  const own = await request(app)
    .get(`${BASE_PATH}/sessions`)
    .set("Cookie", first.cookie!)
    .set("Origin", ORIGIN);
  assert.equal(own.status, 200, JSON.stringify(own.body));
  assert.doesNotMatch(JSON.stringify(own.body), /"token"/);
});

test("PASS: change-password never exposes the rotated token but the cookie rotates", async () => {
  const current = await login(app, "owner@spike.test");
  const other = await login(app, "owner@spike.test");
  assert.ok(current.cookie && current.token && other.cookie);

  const change = await request(app)
    .post(`${BASE_PATH}/change-password`)
    .set("Origin", ORIGIN)
    .set("Cookie", current.cookie!)
    .send({
      currentPassword: PASSWORD,
      newPassword: NEW_PASSWORD,
      revokeOtherSessions: true,
    });

  assert.equal(change.status, 200, JSON.stringify(change.body));
  const body = JSON.stringify(change.body);
  assert.doesNotMatch(body, /"token"/);
  assert.ok(!body.includes(current.token!));
  assert.ok(!body.includes(other.token!));

  const rotatedCookie = extractCookie(change);
  assert.ok(rotatedCookie.length > 0);

  // The old cookie and the other session are invalid; the rotated one works.
  assert.equal((await getSession(app, current.cookie!)).body, null);
  assert.equal((await getSession(app, other.cookie!)).body, null);
  const rotated = await getSession(app, rotatedCookie);
  assert.equal(rotated.status, 200, JSON.stringify(rotated.body));
  assert.equal(rotated.body.user.id, OWNER_ID);

  // The database stores only the digest, never the token from the response.
  const stored = await authV2Prisma.session.findMany({
    where: { userId: OWNER_ID },
  });
  assert.equal(stored.length, 1);
  assert.match(stored[0]!.token, /^v1:[0-9a-f]{64}$/);
});
