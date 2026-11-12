import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import request from "supertest";
import { authV2Prisma } from "../src/modules/auth-v2/prisma.js";
import {
  ADMIN_ID,
  BASE_PATH,
  EMPLOYEE_ID,
  ORIGIN,
  OWNER2_ID,
  OWNER_ID,
  buildApp,
  getSession,
  login,
  resetDb,
  seedUser,
  sessionIdForCookie,
  stepUp,
} from "./helpers.js";

const { app } = buildApp();

const ADMIN2_ID = "66666666-6666-4666-8666-666666666666";

beforeEach(async () => {
  await resetDb();
  await seedUser({
    id: OWNER_ID,
    email: "owner1@spike.test",
    name: "Owner One",
    role: "OWNER",
  });
  await seedUser({
    id: OWNER2_ID,
    email: "owner2@spike.test",
    name: "Owner Two",
    role: "OWNER",
  });
  await seedUser({
    id: ADMIN_ID,
    email: "admin@spike.test",
    name: "Admin",
    role: "ADMIN",
  });
  await seedUser({
    id: EMPLOYEE_ID,
    email: "employee@spike.test",
    name: "Employee",
    role: "EMPLOYEE",
  });
  await seedUser({
    id: ADMIN2_ID,
    email: "admin2@spike.test",
    name: "Admin Two",
    role: "ADMIN",
  });
});

after(async () => {
  await authV2Prisma.$disconnect();
});

function revokeById(cookie: string, sessionId: string) {
  return request(app)
    .post(`${BASE_PATH}/sessions/${sessionId}/revoke`)
    .set("Origin", ORIGIN)
    .set("Cookie", cookie);
}

test("PASS: a user can revoke their own session by ID and keep the current one", async () => {
  const current = await login(app, "owner1@spike.test");
  const other = await login(app, "owner1@spike.test");
  assert.ok(current.cookie && other.cookie);

  const otherId = await sessionIdForCookie(other.cookie!);
  const revoke = await revokeById(current.cookie!, otherId);
  assert.equal(revoke.status, 200, JSON.stringify(revoke.body));
  assert.equal(revoke.body.revoked, 1);

  assert.equal((await getSession(app, other.cookie!)).body, null);
  assert.equal((await getSession(app, current.cookie!)).body.user.id, OWNER_ID);
});

test("PASS: a regular employee cannot revoke another user's session", async () => {
  const owner = await login(app, "owner1@spike.test");
  const employee = await login(app, "employee@spike.test");
  assert.ok(owner.cookie && employee.cookie);

  const ownerSessionId = await sessionIdForCookie(owner.cookie!);
  const revoke = await revokeById(employee.cookie!, ownerSessionId);
  assert.equal(revoke.status, 403, JSON.stringify(revoke.body));
  assert.equal(revoke.body.error, "INSUFFICIENT_PERMISSIONS");
  assert.equal((await getSession(app, owner.cookie!)).body.user.id, OWNER_ID);
});

test("PASS: an ADMIN cannot revoke an OWNER or another ADMIN session", async () => {
  const owner = await login(app, "owner1@spike.test");
  const admin = await login(app, "admin@spike.test");
  const admin2 = await login(app, "admin2@spike.test");
  assert.ok(owner.cookie && admin.cookie && admin2.cookie);
  assert.equal((await stepUp(app, admin.cookie!)).status, 200);

  const ownerSession = await sessionIdForCookie(owner.cookie!);
  const ownerRevoke = await revokeById(admin.cookie!, ownerSession);
  assert.equal(ownerRevoke.status, 403);

  const otherAdminSession = await sessionIdForCookie(admin2.cookie!);
  const adminRevoke = await revokeById(admin.cookie!, otherAdminSession);
  assert.equal(adminRevoke.status, 403);
  assert.equal(adminRevoke.body.error, "INSUFFICIENT_PERMISSIONS");
});

test("PASS: an OWNER must step up before revoking another user's session", async () => {
  const owner = await login(app, "owner1@spike.test");
  const employee = await login(app, "employee@spike.test");
  assert.ok(owner.cookie && employee.cookie);

  const employeeSession = await sessionIdForCookie(employee.cookie!);
  const withoutStepUp = await revokeById(owner.cookie!, employeeSession);
  assert.equal(withoutStepUp.status, 403);
  assert.equal(withoutStepUp.body.error, "REAUTH_REQUIRED");

  assert.equal((await stepUp(app, owner.cookie!)).status, 200);
  const revoke = await revokeById(owner.cookie!, employeeSession);
  assert.equal(revoke.status, 200, JSON.stringify(revoke.body));
  assert.equal((await getSession(app, employee.cookie!)).body, null);
});

test("PASS: an ADMIN can revoke a manageable user's session after step-up", async () => {
  const admin = await login(app, "admin@spike.test");
  const employee = await login(app, "employee@spike.test");
  assert.ok(admin.cookie && employee.cookie);
  assert.equal((await stepUp(app, admin.cookie!)).status, 200);

  const employeeSession = await sessionIdForCookie(employee.cookie!);
  const revoke = await revokeById(admin.cookie!, employeeSession);
  assert.equal(revoke.status, 200, JSON.stringify(revoke.body));
  assert.equal((await getSession(app, employee.cookie!)).body, null);
});

test("PASS: revoking an unknown session ID returns 404", async () => {
  const owner = await login(app, "owner1@spike.test");
  assert.ok(owner.cookie);
  const revoke = await revokeById(
    owner.cookie!,
    "99999999-9999-4999-8999-999999999999",
  );
  assert.equal(revoke.status, 404);
  assert.equal(revoke.body.error, "SESSION_NOT_FOUND");
});

test("PASS: revoke-others keeps the current session and removes the rest", async () => {
  const current = await login(app, "owner1@spike.test");
  const other = await login(app, "owner1@spike.test");
  assert.ok(current.cookie && other.cookie);
  assert.equal(
    await authV2Prisma.session.count({ where: { userId: OWNER_ID } }),
    2,
  );

  const revoke = await request(app)
    .post(`${BASE_PATH}/sessions/revoke-others`)
    .set("Origin", ORIGIN)
    .set("Cookie", current.cookie!);
  assert.equal(revoke.status, 200, JSON.stringify(revoke.body));
  assert.equal(revoke.body.revoked, 1);

  assert.equal((await getSession(app, current.cookie!)).body.user.id, OWNER_ID);
  assert.equal((await getSession(app, other.cookie!)).body, null);
  assert.equal(
    await authV2Prisma.session.count({ where: { userId: OWNER_ID } }),
    1,
  );
});

test("PASS: admin bulk revocation of a manageable user records an audit event", async () => {
  const admin = await login(app, "admin@spike.test");
  const employee = await login(app, "employee@spike.test");
  assert.ok(admin.cookie && employee.cookie);
  assert.equal((await stepUp(app, admin.cookie!)).status, 200);

  const revoke = await request(app)
    .post(`${BASE_PATH}/admin/users/${EMPLOYEE_ID}/revoke-sessions`)
    .set("Origin", ORIGIN)
    .set("Cookie", admin.cookie!);
  assert.equal(revoke.status, 200, JSON.stringify(revoke.body));
  assert.equal(revoke.body.revoked, 1);
  assert.equal((await getSession(app, employee.cookie!)).body, null);

  const event = await authV2Prisma.securityEvent.findFirst({
    where: { eventType: "SESSIONS_REVOKED", targetId: EMPLOYEE_ID },
  });
  assert.ok(event);
});
