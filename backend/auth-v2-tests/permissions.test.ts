import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import request from "supertest";
import {
  PolicyError,
  transferOwnership,
  updateUserAs,
} from "../src/modules/auth-v2/permissions.js";
import { authV2Prisma } from "../src/modules/auth-v2/prisma.js";
import { sanitizeMetadata } from "../src/modules/auth-v2/security.js";
import {
  ADMIN_ID,
  BASE_PATH,
  EMPLOYEE_ID,
  MANAGER_ID,
  ORIGIN,
  OWNER2_ID,
  OWNER_ID,
  PASSWORD,
  buildApp,
  getSession,
  login,
  resetDb,
  seedUser,
  stepUp,
} from "./helpers.js";

const { app } = buildApp();
const ADMIN2_ID = "66666666-6666-4666-8666-666666666666";

async function seedAll() {
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
    id: ADMIN2_ID,
    email: "admin2@spike.test",
    name: "Admin Two",
    role: "ADMIN",
  });
  await seedUser({
    id: EMPLOYEE_ID,
    email: "employee@spike.test",
    name: "Employee",
    role: "EMPLOYEE",
  });
  await seedUser({
    id: MANAGER_ID,
    email: "manager@spike.test",
    name: "Manager",
    role: "HR_MANAGER",
  });
}

beforeEach(async () => {
  await seedAll();
});

after(async () => {
  await authV2Prisma.$disconnect();
});

async function patchUser(
  cookie: string,
  userId: string,
  body: Record<string, unknown>,
) {
  return request(app)
    .patch(`${BASE_PATH}/admin/users/${userId}`)
    .set("Origin", ORIGIN)
    .set("Cookie", cookie)
    .send(body);
}

test("PASS: OWNER lists everyone while ADMIN is scoped to lower roles", async () => {
  const owner = await login(app, "owner1@spike.test");
  const admin = await login(app, "admin@spike.test");
  assert.ok(owner.cookie && admin.cookie);

  const ownerList = await request(app)
    .get(`${BASE_PATH}/admin/users`)
    .set("Cookie", owner.cookie!)
    .set("Origin", ORIGIN);
  assert.equal(ownerList.status, 200);
  assert.equal(ownerList.body.users.length, 6);

  const adminList = await request(app)
    .get(`${BASE_PATH}/admin/users`)
    .set("Cookie", admin.cookie!)
    .set("Origin", ORIGIN);
  assert.equal(adminList.status, 200);
  const roles = adminList.body.users.map((user: { role: string }) => user.role);
  assert.ok(!roles.includes("OWNER"));
  assert.ok(!roles.includes("ADMIN"));
  assert.ok(roles.includes("EMPLOYEE"));
  assert.ok(roles.includes("HR_MANAGER"));
});

test("PASS: ADMIN cannot promote to ADMIN/OWNER or manage an ADMIN/OWNER", async () => {
  const admin = await login(app, "admin@spike.test");
  assert.ok(admin.cookie);
  assert.equal((await stepUp(app, admin.cookie!)).status, 200);

  const promoteAdmin = await patchUser(admin.cookie!, EMPLOYEE_ID, {
    role: "ADMIN",
  });
  assert.equal(promoteAdmin.status, 403);
  assert.equal(promoteAdmin.body.error, "INSUFFICIENT_PERMISSIONS");

  const promoteOwner = await patchUser(admin.cookie!, EMPLOYEE_ID, {
    role: "OWNER",
  });
  assert.equal(promoteOwner.status, 403);

  const touchAdmin = await patchUser(admin.cookie!, ADMIN2_ID, {
    role: "EMPLOYEE",
  });
  assert.equal(touchAdmin.status, 403);

  const touchOwner = await patchUser(admin.cookie!, OWNER_ID, {
    isActive: false,
  });
  assert.equal(touchOwner.status, 403);
});

test("PASS: ADMIN can manage a lower role and the change revokes sessions", async () => {
  const admin = await login(app, "admin@spike.test");
  const employee = await login(app, "employee@spike.test");
  assert.ok(admin.cookie && employee.cookie);
  assert.equal((await stepUp(app, admin.cookie!)).status, 200);

  const change = await patchUser(admin.cookie!, EMPLOYEE_ID, {
    role: "ACCOUNTANT",
  });
  assert.equal(change.status, 200, JSON.stringify(change.body));
  assert.equal(change.body.user.role, "ACCOUNTANT");
  assert.equal(
    await authV2Prisma.session.count({ where: { userId: EMPLOYEE_ID } }),
    0,
  );
  assert.equal((await getSession(app, employee.cookie!)).body, null);
});

test("PASS: deactivation revokes all target sessions", async () => {
  const owner = await login(app, "owner1@spike.test");
  const employee = await login(app, "employee@spike.test");
  assert.ok(owner.cookie && employee.cookie);
  assert.equal((await stepUp(app, owner.cookie!)).status, 200);

  const change = await patchUser(owner.cookie!, EMPLOYEE_ID, {
    isActive: false,
  });
  assert.equal(change.status, 200, JSON.stringify(change.body));
  assert.equal(change.body.user.isActive, false);
  assert.equal(
    await authV2Prisma.session.count({ where: { userId: EMPLOYEE_ID } }),
    0,
  );
  assert.equal((await getSession(app, employee.cookie!)).body, null);
});

test("PASS: self role change and self deactivation are rejected", async () => {
  const owner = await login(app, "owner1@spike.test");
  assert.ok(owner.cookie);
  assert.equal((await stepUp(app, owner.cookie!)).status, 200);

  const demoteSelf = await patchUser(owner.cookie!, OWNER_ID, {
    role: "ADMIN",
  });
  assert.equal(demoteSelf.status, 403);
  assert.equal(demoteSelf.body.error, "SELF_MODIFICATION_FORBIDDEN");

  const deactivateSelf = await patchUser(owner.cookie!, OWNER_ID, {
    isActive: false,
  });
  assert.equal(deactivateSelf.status, 403);
  assert.equal(deactivateSelf.body.error, "SELF_MODIFICATION_FORBIDDEN");
});

test("PASS: last-OWNER protection rejects removal of the final active OWNER", async () => {
  await authV2Prisma.appUser.update({
    where: { id: OWNER2_ID },
    data: { isActive: false },
  });

  await assert.rejects(
    updateUserAs(
      { id: "ghost-owner", role: "OWNER", isActive: true },
      OWNER_ID,
      { role: "ADMIN" },
    ),
    (error: unknown) =>
      error instanceof PolicyError && error.code === "LAST_OWNER_PROTECTION",
  );

  const stillOwner = await authV2Prisma.appUser.findUniqueOrThrow({
    where: { id: OWNER_ID },
  });
  assert.equal(stillOwner.role, "OWNER");
});

test("PASS: concurrent OWNER demotions leave at least one OWNER", async () => {
  const results = await Promise.allSettled([
    updateUserAs(
      { id: OWNER_ID, role: "OWNER", isActive: true },
      OWNER2_ID,
      { role: "ADMIN" },
    ),
    updateUserAs(
      { id: OWNER2_ID, role: "OWNER", isActive: true },
      OWNER_ID,
      { role: "ADMIN" },
    ),
  ]);

  const fulfilled = results.filter((entry) => entry.status === "fulfilled");
  const rejected = results.filter((entry) => entry.status === "rejected");
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  if (rejected[0]?.status === "rejected") {
    assert.equal(
      (rejected[0].reason as PolicyError).code,
      "LAST_OWNER_PROTECTION",
    );
  }

  assert.equal(
    await authV2Prisma.appUser.count({
      where: { role: "OWNER", isActive: true },
    }),
    1,
  );
});

test("PASS: sensitive user management requires recent reauthentication", async () => {
  const owner = await login(app, "owner1@spike.test");
  assert.ok(owner.cookie);

  const withoutReauth = await patchUser(owner.cookie!, EMPLOYEE_ID, {
    role: "ACCOUNTANT",
  });
  assert.equal(withoutReauth.status, 403);
  assert.equal(withoutReauth.body.error, "REAUTH_REQUIRED");

  const wrong = await stepUp(app, owner.cookie!, "Wrong-Password-2026");
  assert.equal(wrong.status, 401);

  assert.equal((await stepUp(app, owner.cookie!)).status, 200);
  const afterReauth = await patchUser(owner.cookie!, EMPLOYEE_ID, {
    role: "ACCOUNTANT",
  });
  assert.equal(afterReauth.status, 200, JSON.stringify(afterReauth.body));
});

test("PASS: OWNER transfer is atomic and revokes both parties' sessions", async () => {
  const owner = await login(app, "owner1@spike.test");
  const admin = await login(app, "admin@spike.test");
  assert.ok(owner.cookie && admin.cookie);
  assert.equal((await stepUp(app, owner.cookie!)).status, 200);

  const transfer = await request(app)
    .post(`${BASE_PATH}/admin/owner/transfer`)
    .set("Origin", ORIGIN)
    .set("Cookie", owner.cookie!)
    .send({ targetId: ADMIN_ID });
  assert.equal(transfer.status, 200, JSON.stringify(transfer.body));
  assert.equal(transfer.body.previousOwnerId, OWNER_ID);
  assert.equal(transfer.body.newOwnerId, ADMIN_ID);

  const oldOwner = await authV2Prisma.appUser.findUniqueOrThrow({
    where: { id: OWNER_ID },
  });
  const newOwner = await authV2Prisma.appUser.findUniqueOrThrow({
    where: { id: ADMIN_ID },
  });
  assert.equal(oldOwner.role, "ADMIN");
  assert.equal(newOwner.role, "OWNER");
  assert.equal(
    await authV2Prisma.session.count({
      where: { userId: { in: [OWNER_ID, ADMIN_ID] } },
    }),
    0,
  );
  assert.equal((await getSession(app, owner.cookie!)).body, null);
  assert.equal((await getSession(app, admin.cookie!)).body, null);
});

test("PASS: audit events are written and sensitive metadata is removed", async () => {
  const owner = await login(app, "owner1@spike.test");
  assert.ok(owner.cookie);
  assert.equal((await stepUp(app, owner.cookie!)).status, 200);
  const change = await patchUser(owner.cookie!, EMPLOYEE_ID, {
    role: "ACCOUNTANT",
  });
  assert.equal(change.status, 200);

  const events = await authV2Prisma.securityEvent.findMany({
    orderBy: { createdAt: "asc" },
  });
  const types = events.map((event) => event.eventType);
  assert.ok(types.includes("STEP_UP_SUCCESS"));
  assert.ok(types.includes("USER_SECURITY_CHANGE"));

  const sanitized = sanitizeMetadata({
    token: "secret-token",
    password: "secret-password",
    cookie: "session=abc",
    nested: { authorization: "Bearer abc", kept: 1 },
  }) as Record<string, unknown>;
  assert.equal(sanitized.token, undefined);
  assert.equal(sanitized.password, undefined);
  assert.equal(sanitized.cookie, undefined);
  assert.deepEqual(sanitized.nested, { kept: 1 });
});

test("PASS: password hashes are Argon2id and never plaintext", async () => {
  const account = await authV2Prisma.account.findFirstOrThrow({
    where: { userId: EMPLOYEE_ID },
  });
  assert.match(account.password ?? "", /^\$argon2id\$/);
  assert.notEqual(account.password, PASSWORD);
});

test("PASS: only an OWNER can transfer ownership", async () => {
  const admin = await login(app, "admin@spike.test");
  assert.ok(admin.cookie);
  assert.equal((await stepUp(app, admin.cookie!)).status, 200);

  const transfer = await request(app)
    .post(`${BASE_PATH}/admin/owner/transfer`)
    .set("Origin", ORIGIN)
    .set("Cookie", admin.cookie!)
    .send({ targetId: EMPLOYEE_ID });
  assert.equal(transfer.status, 403);

  await assert.rejects(
    transferOwnership(
      { id: ADMIN_ID, role: "ADMIN", isActive: true },
      EMPLOYEE_ID,
    ),
    (error: unknown) =>
      error instanceof PolicyError && error.code === "INSUFFICIENT_PERMISSIONS",
  );
});
