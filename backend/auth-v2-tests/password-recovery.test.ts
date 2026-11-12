import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import request from "supertest";
import {
  authV2Outbox,
  clearAuthV2Outbox,
} from "../src/modules/auth-v2/email.js";
import { authV2Prisma } from "../src/modules/auth-v2/prisma.js";
import {
  BASE_PATH,
  NEW_PASSWORD,
  ORIGIN,
  OWNER_ID,
  PASSWORD,
  buildApp,
  getSession,
  login,
  resetDb,
  seedUser,
} from "./helpers.js";

const { app } = buildApp();

beforeEach(async () => {
  await resetDb();
  clearAuthV2Outbox();
  await seedUser({
    id: OWNER_ID,
    email: "owner@spike.test",
    name: "Owner",
    role: "OWNER",
  });
});

after(async () => {
  await authV2Prisma.$disconnect();
});

function requestReset(email: string) {
  return request(app)
    .post(`${BASE_PATH}/request-password-reset`)
    .set("Origin", ORIGIN)
    .send({ email });
}

function submitReset(token: string, newPassword: string) {
  return request(app)
    .post(`${BASE_PATH}/reset-password`)
    .set("Origin", ORIGIN)
    .send({ token, newPassword });
}

test("PASS: reset request is generic and stores only a hashed identifier", async () => {
  const response = await requestReset("owner@spike.test");
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(response.body.status, true);

  assert.equal(authV2Outbox.passwordResets.length, 1);
  const email = authV2Outbox.passwordResets[0]!;
  assert.equal(email.userId, OWNER_ID);
  assert.equal(email.email, "owner@spike.test");
  assert.ok(email.url.includes("/reset-password/"));
  assert.ok(email.url.includes(email.token));

  const rows = await authV2Prisma.verification.findMany();
  assert.equal(rows.length, 1);
  const expected = createHash("sha256")
    .update(`reset-password:${email.token}`, "utf8")
    .digest("base64url");
  assert.equal(rows[0]!.identifier, expected);
  assert.notEqual(rows[0]!.identifier, `reset-password:${email.token}`);
  assert.ok(!rows[0]!.identifier.includes(email.token));
  assert.ok(!rows[0]!.value.includes(email.token));
});

test("PASS: an unknown email returns the same generic response and issues no token", async () => {
  const existing = await requestReset("owner@spike.test");
  clearAuthV2Outbox();
  await authV2Prisma.verification.deleteMany();

  const unknown = await requestReset("nobody@spike.test");
  assert.equal(unknown.status, 200, JSON.stringify(unknown.body));
  assert.deepEqual(unknown.body, existing.body);
  assert.equal(authV2Outbox.passwordResets.length, 0);
  assert.equal(await authV2Prisma.verification.count(), 0);
});

test("PASS: a reset token is single-use, revokes sessions and rotates the password", async () => {
  const session = await login(app, "owner@spike.test");
  assert.ok(session.cookie);

  await requestReset("owner@spike.test");
  const token = authV2Outbox.passwordResets[0]!.token;

  const reset = await submitReset(token, NEW_PASSWORD);
  assert.equal(reset.status, 200, JSON.stringify(reset.body));

  assert.equal((await getSession(app, session.cookie!)).body, null);
  assert.equal(
    await authV2Prisma.session.count({ where: { userId: OWNER_ID } }),
    0,
  );
  assert.equal(await authV2Prisma.verification.count(), 0);

  const replay = await submitReset(token, "Another-Horse-Battery-2026");
  assert.equal(replay.status, 400, JSON.stringify(replay.body));

  const oldPassword = await login(app, "owner@spike.test", PASSWORD);
  assert.equal(oldPassword.res.status, 401);

  const newPassword = await login(app, "owner@spike.test", NEW_PASSWORD);
  assert.equal(
    newPassword.res.status,
    200,
    JSON.stringify(newPassword.res.body),
  );
});

test("PASS: an expired reset token is rejected and the password is unchanged", async () => {
  await requestReset("owner@spike.test");
  const token = authV2Outbox.passwordResets[0]!.token;

  await authV2Prisma.verification.updateMany({
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });

  const reset = await submitReset(token, NEW_PASSWORD);
  assert.equal(reset.status, 400, JSON.stringify(reset.body));

  const oldPassword = await login(app, "owner@spike.test", PASSWORD);
  assert.equal(
    oldPassword.res.status,
    200,
    JSON.stringify(oldPassword.res.body),
  );
});

test("PASS: a short new password is rejected before the token is consumed", async () => {
  await requestReset("owner@spike.test");
  const token = authV2Outbox.passwordResets[0]!.token;

  const weak = await submitReset(token, "too-short");
  assert.equal(weak.status, 400, JSON.stringify(weak.body));
  assert.equal(await authV2Prisma.verification.count(), 1);

  const valid = await submitReset(token, NEW_PASSWORD);
  assert.equal(valid.status, 200, JSON.stringify(valid.body));
});

test("PASS: reset requests and completions are written to the audit trail", async () => {
  await requestReset("owner@spike.test");
  const token = authV2Outbox.passwordResets[0]!.token;
  await submitReset(token, NEW_PASSWORD);

  const events = await authV2Prisma.securityEvent.findMany({
    orderBy: { createdAt: "asc" },
  });
  assert.ok(
    events.some((event) => event.eventType === "PASSWORD_RESET_COMPLETED"),
  );
});

test("PASS: the reset request endpoint is rate limited per IP", async () => {
  const limited = buildApp({
    config: {
      loginRateLimit: {
        windowMs: 60_000,
        maxFailures: 5,
        blockMs: 60_000,
        maxFailuresPerIp: 2,
      },
    },
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await request(limited.app)
      .post(`${BASE_PATH}/request-password-reset`)
      .set("Origin", ORIGIN)
      .send({ email: "owner@spike.test" });
    assert.equal(response.status, 200, JSON.stringify(response.body));
  }

  const blocked = await request(limited.app)
    .post(`${BASE_PATH}/request-password-reset`)
    .set("Origin", ORIGIN)
    .send({ email: "owner@spike.test" });
  assert.equal(blocked.status, 429, JSON.stringify(blocked.body));
  assert.equal(blocked.body.error, "RATE_LIMITED");
});

test("PASS: cross-origin reset requests are rejected", async () => {
  const crossed = await request(app)
    .post(`${BASE_PATH}/request-password-reset`)
    .set("Origin", "https://evil.example")
    .send({ email: "owner@spike.test" });
  assert.equal(crossed.status, 403);
  assert.equal(crossed.body.error, "INVALID_ORIGIN");
  assert.equal(authV2Outbox.passwordResets.length, 0);
});
