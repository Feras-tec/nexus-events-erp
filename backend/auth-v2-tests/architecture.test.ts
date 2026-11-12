import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import request from "supertest";
import {
  assertAuthV2Enabled,
  readAuthV2Config,
} from "../src/modules/auth-v2/config.js";
import { createAuthV2 } from "../src/modules/auth-v2/auth.js";
import { authV2Prisma } from "../src/modules/auth-v2/prisma.js";
import {
  hashInvitationToken,
  hashSessionToken,
} from "../src/modules/auth-v2/token-hash.js";
import {
  BASE_PATH,
  ORIGIN,
  OWNER_ID,
  buildApp,
  getSession,
  login,
  resetDb,
  seedUser,
} from "./helpers.js";

const { app } = buildApp();
const LEGACY_CLERK_ID = "clerk_legacy_owner";

type ColumnRow = { column_name: string; is_nullable: string };
type RoleRow = { role: string };
type FkRow = {
  referencing_table: string;
  referenced_table: string;
  on_delete: string;
};

before(async () => {
  await resetDb();
  await seedUser({
    id: OWNER_ID,
    email: "legacy.owner@spike.test",
    name: "Legacy Owner",
    role: "OWNER",
    clerkUserId: LEGACY_CLERK_ID,
  });
});

after(async () => {
  await authV2Prisma.$disconnect();
});

test("PASS: legacy AppUser identity, role and activation state survive login", async () => {
  const legacy = await authV2Prisma.appUser.findUniqueOrThrow({
    where: { id: OWNER_ID },
  });
  assert.equal(legacy.id, OWNER_ID);
  assert.equal(legacy.role, "OWNER");
  assert.equal(legacy.isActive, true);
  assert.equal(legacy.clerkUserId, LEGACY_CLERK_ID);

  await authV2Prisma.appUser.update({
    where: { id: OWNER_ID },
    data: { emailVerified: true },
  });
  const afterUpdate = await authV2Prisma.appUser.findUniqueOrThrow({
    where: { id: OWNER_ID },
  });
  assert.equal(afterUpdate.id, OWNER_ID);
  assert.equal(afterUpdate.role, "OWNER");
  assert.equal(afterUpdate.isActive, true);
  assert.equal(afterUpdate.clerkUserId, LEGACY_CLERK_ID);

  const session = await login(app, "legacy.owner@spike.test");
  assert.equal(session.res.status, 200, JSON.stringify(session.res.body));
  assert.equal(session.res.body.user.id, OWNER_ID);
  assert.equal(session.res.body.user.email, "legacy.owner@spike.test");
  assert.equal((await getSession(app, session.cookie!)).body.user.id, OWNER_ID);
});

test("PASS: new accounts need no Clerk identity (clerkUserId is nullable)", async () => {
  const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const created = await authV2Prisma.appUser.create({
    data: { id, email: "new.owner@spike.test" },
  });
  assert.equal(created.clerkUserId, null);
  assert.equal(created.emailVerified, false);
  assert.equal(created.name, "");
  assert.equal(created.image, null);
  assert.equal(created.role, "EMPLOYEE");
  assert.equal(created.isActive, true);
  assert.equal(created.twoFactorRequired, false);
  await authV2Prisma.appUser.delete({ where: { id } });
});

test("PASS: email is unique and nullable, matching the migration preconditions", async () => {
  await assert.rejects(
    authV2Prisma.appUser.create({
      data: {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        email: "legacy.owner@spike.test",
      },
    }),
  );

  const columns = await authV2Prisma.$queryRaw<ColumnRow[]>`
    SELECT column_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'AppUser'
  `;
  const byName = new Map(columns.map((column) => [column.column_name, column]));
  assert.equal(byName.get("id")?.is_nullable, "NO");
  assert.equal(byName.get("email")?.is_nullable, "YES");
  assert.equal(byName.get("clerkUserId")?.is_nullable, "YES");
  assert.equal(byName.get("role")?.is_nullable, "NO");
  assert.equal(byName.get("isActive")?.is_nullable, "NO");
  assert.equal(byName.get("emailVerified")?.is_nullable, "NO");
  assert.equal(byName.get("name")?.is_nullable, "NO");
  assert.equal(byName.get("twoFactorRequired")?.is_nullable, "NO");
});

test("PASS: the 12 UserRole values are unchanged", async () => {
  const roles = await authV2Prisma.$queryRaw<RoleRow[]>`
    SELECT unnest(enum_range(NULL::"UserRole"))::text AS role
  `;
  assert.deepEqual(
    roles.map((row) => row.role).sort(),
    [
      "ACCOUNTANT",
      "ADMIN",
      "DEPARTMENT_MANAGER",
      "EMPLOYEE",
      "HR_MANAGER",
      "OWNER",
      "PROJECT_MANAGER",
      "SALES_EMPLOYEE",
      "SALES_MANAGER",
      "TECHNICIAN",
      "WAREHOUSE_EMPLOYEE",
      "WAREHOUSE_MANAGER",
    ].sort(),
  );
});

test("PASS: auth tables cascade from AppUser while the audit trail keeps events", async () => {
  const fks = await authV2Prisma.$queryRaw<FkRow[]>`
    SELECT
      conrelid::regclass::text AS referencing_table,
      confrelid::regclass::text AS referenced_table,
      confdeltype::text AS on_delete
    FROM pg_constraint
    WHERE contype = 'f' AND confrelid = '"AppUser"'::regclass
    ORDER BY 1, 2
  `;

  for (const fk of fks) {
    assert.equal(fk.referenced_table, '"AppUser"');
  }
  const referencing = new Set(
    fks.map((fk) => fk.referencing_table.replaceAll('"', "")),
  );
  assert.deepEqual(
    [...referencing].sort(),
    ["Account", "Invitation", "SecurityEvent", "Session", "TwoFactor"],
  );

  const cascadeTables = ["Session", "Account", "TwoFactor", "Invitation"];
  for (const fk of fks) {
    const table = fk.referencing_table.replaceAll('"', "");
    if (cascadeTables.includes(table)) {
      assert.equal(fk.on_delete, "c", `${table} must cascade`);
    } else {
      assert.equal(fk.on_delete, "n", "SecurityEvent must SET NULL");
    }
  }
});

test("PASS: deleting a user cascades auth rows but keeps the audit trail", async () => {
  const id = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  await seedUser({
    id,
    email: "temporary@spike.test",
    name: "Temporary",
    role: "EMPLOYEE",
  });
  const session = await login(app, "temporary@spike.test");
  assert.equal(session.res.status, 200);

  await authV2Prisma.securityEvent.create({
    data: { eventType: "TEST_EVENT", actorId: id, targetId: id },
  });

  await authV2Prisma.appUser.delete({ where: { id } });

  assert.equal(
    await authV2Prisma.session.count({ where: { userId: id } }),
    0,
  );
  assert.equal(
    await authV2Prisma.account.count({ where: { userId: id } }),
    0,
  );
  const event = await authV2Prisma.securityEvent.findFirstOrThrow({
    where: { eventType: "TEST_EVENT" },
  });
  assert.equal(event.actorId, null);
  assert.equal(event.targetId, null);
});

test("PASS: session-token hashing is deterministic and never stores the raw token", () => {
  const raw = "A".repeat(32);
  const digest = hashSessionToken(raw);
  assert.match(digest, /^v1:[0-9a-f]{64}$/);
  assert.equal(hashSessionToken(raw), digest);
  assert.equal(hashSessionToken(digest), digest);
  assert.ok(!digest.includes(raw));

  const invitationToken = "invitation-token-value";
  assert.match(hashInvitationToken(invitationToken), /^[0-9a-f]{64}$/);
  assert.notEqual(hashInvitationToken(invitationToken), invitationToken);
});

test("PASS: auth-v2 is primary by default and Clerk requires explicit selection", () => {
  const secret = "s".repeat(48);
  const config = readAuthV2Config({ AUTH_V2_AUTH_SECRET: secret });
  assert.equal(config.enabled, true);
  assert.equal(config.basePath, BASE_PATH);
  const fallback = readAuthV2Config({AUTH_MODE:"clerk",AUTH_V2_AUTH_SECRET:secret});
  assert.equal(fallback.enabled,false);
  assert.throws(() => assertAuthV2Enabled(fallback), /disabled/i);
  assert.throws(() => createAuthV2(fallback), /disabled/i);

  assert.throws(
    () => readAuthV2Config({ AUTH_V2_ENABLED: "true" }),
    /AUTH_V2_AUTH_SECRET/,
  );
});

test("PASS: selected auth mode controls the mounted provider", async () => {
  const appSource = await readFile(
    new URL("../src/app.ts", import.meta.url),
    "utf8",
  );
  assert.match(appSource, /getAuthMode/);
  assert.match(appSource, /authMode === "clerk"/);
  assert.match(appSource, /getAuthV2Runtime/);
  assert.match(appSource, /createAuthV2Router/);
  assert.match(appSource, /clerkMiddleware/);
  assert.match(appSource, /authRoutes/);

  const authRoutesSource = await readFile(
    new URL("../src/routes/auth.routes.ts", import.meta.url),
    "utf8",
  );
  assert.match(authRoutesSource, /@clerk\/express/);
  assert.doesNotMatch(authRoutesSource, /auth-v2/);
});

test("PASS: the prepared migration is additive only", async () => {
  const { readdir } = await import("node:fs/promises");
  const migrationsDir = new URL("../prisma/migrations/", import.meta.url);
  const entries = await readdir(migrationsDir);
  const authMigration = entries.find((entry) => entry.endsWith("_add_auth_v2"));
  assert.ok(authMigration, "add_auth_v2 migration is missing");

  const sql = await readFile(
    new URL(`${authMigration}/migration.sql`, migrationsDir),
    "utf8",
  );
  assert.match(sql, /ALTER COLUMN "clerkUserId" DROP NOT NULL/);
  assert.doesNotMatch(sql, /DROP\s+TABLE/i);
  assert.doesNotMatch(sql, /DROP\s+COLUMN/i);
  assert.doesNotMatch(sql, /DROP\s+TYPE/i);
  assert.doesNotMatch(sql, /TRUNCATE/i);
  assert.match(sql, /CREATE TABLE "Session"/);
  assert.match(sql, /CREATE TABLE "TwoFactor"/);
  assert.match(sql, /CREATE TABLE "Invitation"/);
  assert.match(sql, /CREATE UNIQUE INDEX "AppUser_email_key"/);
});

test("PASS: the Clerk RBAC endpoints remain reachable in the existing app", async () => {
  const response = await request(app).get(`${BASE_PATH}/admin/users`);
  assert.equal(response.status, 401);
  assert.equal(response.body.error, "UNAUTHENTICATED");
  assert.ok(ORIGIN);
});
