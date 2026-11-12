import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import request from "supertest";
import { authV2Outbox, clearAuthV2Outbox } from "../src/modules/auth-v2/email.js";
import { hashInvitationToken } from "../src/modules/auth-v2/token-hash.js";
import { authV2Prisma } from "../src/modules/auth-v2/prisma.js";
import {
  ADMIN_ID,
  BASE_PATH,
  EMPLOYEE_ID,
  ORIGIN,
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
const INVITE_PASSWORD = "New-Employee-Password-2026";

beforeEach(async () => {
  await resetDb();
  clearAuthV2Outbox();
  await seedUser({
    id: OWNER_ID,
    email: "owner@spike.test",
    name: "Owner",
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
});

after(async () => {
  await authV2Prisma.$disconnect();
});

async function createInvite(
  cookie: string,
  email: string,
  role: string,
) {
  clearAuthV2Outbox();
  const res = await request(app)
    .post(`${BASE_PATH}/invitations`)
    .set("Origin", ORIGIN)
    .set("Cookie", cookie)
    .send({ email, role });
  const token = authV2Outbox.invitations.at(-1)?.token;
  return { res, token };
}

function accept(token: string, password = INVITE_PASSWORD, name = "New Employee") {
  return request(app)
    .post(`${BASE_PATH}/invitations/accept`)
    .set("Origin", ORIGIN)
    .send({ token, password, name });
}

test("PASS: an OWNER creates an invitation whose token is stored only as a digest", async () => {
  const owner = await login(app, "owner@spike.test");
  assert.ok(owner.cookie);
  assert.equal((await stepUp(app, owner.cookie!)).status, 200);

  const { res, token } = await createInvite(
    owner.cookie!,
    "new.accountant@spike.test",
    "ACCOUNTANT",
  );
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.invitation.email, "new.accountant@spike.test");
  assert.equal(res.body.invitation.role, "ACCOUNTANT");
  assert.doesNotMatch(JSON.stringify(res.body), /token/i);

  assert.ok(token);
  assert.equal(token!.length, 43);
  assert.equal(authV2Outbox.invitations.length, 1);

  const row = await authV2Prisma.invitation.findFirstOrThrow({
    where: { normalizedEmail: "new.accountant@spike.test" },
  });
  assert.equal(row.tokenHash, hashInvitationToken(token!));
  assert.notEqual(row.tokenHash, token);
  assert.ok(!row.tokenHash.includes(token!));
  assert.equal(row.acceptedAt, null);
  assert.equal(row.revokedAt, null);
});

test("PASS: an accepted invitation creates an Argon2id account with the invited role", async () => {
  const owner = await login(app, "owner@spike.test");
  assert.ok(owner.cookie);
  assert.equal((await stepUp(app, owner.cookie!)).status, 200);

  const { token } = await createInvite(
    owner.cookie!,
    "new.accountant@spike.test",
    "ACCOUNTANT",
  );
  assert.ok(token);

  const accepted = await accept(token!, INVITE_PASSWORD, "New Accountant");
  assert.equal(accepted.status, 201, JSON.stringify(accepted.body));
  assert.equal(accepted.body.status, true);
  assert.equal(accepted.body.user.email, "new.accountant@spike.test");
  assert.equal(accepted.body.user.role, "ACCOUNTANT");

  const user = await authV2Prisma.appUser.findUniqueOrThrow({
    where: { email: "new.accountant@spike.test" },
  });
  assert.equal(user.role, "ACCOUNTANT");
  assert.equal(user.isActive, true);
  assert.equal(user.emailVerified, true);
  assert.equal(user.clerkUserId, null);
  assert.equal(user.name, "New Accountant");

  const account = await authV2Prisma.account.findFirstOrThrow({
    where: { userId: user.id, providerId: "credential" },
  });
  assert.match(account.password ?? "", /^\$argon2id\$/);
  assert.notEqual(account.password, INVITE_PASSWORD);

  const invitation = await authV2Prisma.invitation.findFirstOrThrow({
    where: { normalizedEmail: "new.accountant@spike.test" },
  });
  assert.ok(invitation.acceptedAt);

  const loginResult = await login(app, "new.accountant@spike.test", INVITE_PASSWORD);
  assert.equal(loginResult.res.status, 200, JSON.stringify(loginResult.res.body));
  const session = await getSession(app, loginResult.cookie!);
  assert.equal(session.body.user.role, "ACCOUNTANT");
});

test("PASS: an invitation token is single-use", async () => {
  const owner = await login(app, "owner@spike.test");
  assert.ok(owner.cookie);
  assert.equal((await stepUp(app, owner.cookie!)).status, 200);
  const { token } = await createInvite(
    owner.cookie!,
    "single.use@spike.test",
    "EMPLOYEE",
  );

  const first = await accept(token!);
  assert.equal(first.status, 201, JSON.stringify(first.body));

  const replay = await accept(token!, "Another-Password-2026");
  assert.equal(replay.status, 400, JSON.stringify(replay.body));
  assert.equal(replay.body.error, "INVITATION_ALREADY_USED");
});

test("PASS: unknown, expired and revoked invitation tokens are rejected", async () => {
  const unknown = await accept("A".repeat(43));
  assert.equal(unknown.status, 400);
  assert.equal(unknown.body.error, "INVALID_INVITATION");

  const owner = await login(app, "owner@spike.test");
  assert.ok(owner.cookie);
  assert.equal((await stepUp(app, owner.cookie!)).status, 200);

  const expired = await createInvite(
    owner.cookie!,
    "expired@spike.test",
    "EMPLOYEE",
  );
  await authV2Prisma.invitation.updateMany({
    where: { normalizedEmail: "expired@spike.test" },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });
  const expiredAccept = await accept(expired.token!);
  assert.equal(expiredAccept.status, 400);
  assert.equal(expiredAccept.body.error, "INVITATION_EXPIRED");

  const revoked = await createInvite(
    owner.cookie!,
    "revoked@spike.test",
    "EMPLOYEE",
  );
  const invitation = await authV2Prisma.invitation.findFirstOrThrow({
    where: { normalizedEmail: "revoked@spike.test" },
  });
  const revoke = await request(app)
    .post(`${BASE_PATH}/invitations/${invitation.id}/revoke`)
    .set("Origin", ORIGIN)
    .set("Cookie", owner.cookie!);
  assert.equal(revoke.status, 200, JSON.stringify(revoke.body));

  const revokedAccept = await accept(revoked.token!);
  assert.equal(revokedAccept.status, 400);
  assert.equal(revokedAccept.body.error, "INVITATION_REVOKED");
});

test("PASS: a weak password is rejected without consuming the invitation", async () => {
  const owner = await login(app, "owner@spike.test");
  assert.ok(owner.cookie);
  assert.equal((await stepUp(app, owner.cookie!)).status, 200);
  const { token } = await createInvite(
    owner.cookie!,
    "weak@spike.test",
    "EMPLOYEE",
  );

  const weak = await accept(token!, "too-short");
  assert.equal(weak.status, 400);
  assert.equal(weak.body.error, "WEAK_PASSWORD");

  const valid = await accept(token!);
  assert.equal(valid.status, 201, JSON.stringify(valid.body));
});

test("PASS: duplicate pending invitations and existing emails are rejected", async () => {
  const owner = await login(app, "owner@spike.test");
  assert.ok(owner.cookie);
  assert.equal((await stepUp(app, owner.cookie!)).status, 200);

  const first = await createInvite(
    owner.cookie!,
    "duplicate@spike.test",
    "EMPLOYEE",
  );
  assert.equal(first.res.status, 201);

  const second = await createInvite(
    owner.cookie!,
    "duplicate@spike.test",
    "EMPLOYEE",
  );
  assert.equal(second.res.status, 409);
  assert.equal(second.res.body.error, "INVITATION_ALREADY_PENDING");

  const existing = await createInvite(
    owner.cookie!,
    "employee@spike.test",
    "EMPLOYEE",
  );
  assert.equal(existing.res.status, 409);
  assert.equal(existing.res.body.error, "EMAIL_IN_USE");
});

test("PASS: an ADMIN cannot invite an OWNER or another ADMIN", async () => {
  const admin = await login(app, "admin@spike.test");
  assert.ok(admin.cookie);
  assert.equal((await stepUp(app, admin.cookie!)).status, 200);

  const ownerInvite = await createInvite(
    admin.cookie!,
    "new.owner@spike.test",
    "OWNER",
  );
  assert.equal(ownerInvite.res.status, 403);

  const adminInvite = await createInvite(
    admin.cookie!,
    "new.admin@spike.test",
    "ADMIN",
  );
  assert.equal(adminInvite.res.status, 403);

  const employeeInvite = await createInvite(
    admin.cookie!,
    "new.employee@spike.test",
    "EMPLOYEE",
  );
  assert.equal(employeeInvite.res.status, 201);
});

test("PASS: invitation creation requires a recent step-up", async () => {
  const owner = await login(app, "owner@spike.test");
  assert.ok(owner.cookie);

  const withoutStepUp = await createInvite(
    owner.cookie!,
    "no.stepup@spike.test",
    "EMPLOYEE",
  );
  assert.equal(withoutStepUp.res.status, 403);
  assert.equal(withoutStepUp.res.body.error, "REAUTH_REQUIRED");
});

test("PASS: listing invitations never exposes the token digest", async () => {
  const owner = await login(app, "owner@spike.test");
  assert.ok(owner.cookie);
  assert.equal((await stepUp(app, owner.cookie!)).status, 200);
  await createInvite(owner.cookie!, "listed@spike.test", "EMPLOYEE");

  const listed = await request(app)
    .get(`${BASE_PATH}/invitations`)
    .set("Origin", ORIGIN)
    .set("Cookie", owner.cookie!);
  assert.equal(listed.status, 200, JSON.stringify(listed.body));
  assert.equal(listed.body.invitations.length, 1);
  assert.doesNotMatch(JSON.stringify(listed.body), /tokenHash/i);
  assert.doesNotMatch(JSON.stringify(listed.body), /token/i);
});

test("PASS: a regular employee cannot invite or list invitations", async () => {
  const employee = await login(app, "employee@spike.test");
  assert.ok(employee.cookie);

  const create = await createInvite(
    employee.cookie!,
    "blocked@spike.test",
    "EMPLOYEE",
  );
  assert.equal(create.res.status, 403);
  assert.equal(create.res.body.error, "INSUFFICIENT_PERMISSIONS");

  const list = await request(app)
    .get(`${BASE_PATH}/invitations`)
    .set("Cookie", employee.cookie!)
    .set("Origin", ORIGIN);
  assert.equal(list.status, 403);
});

test("PASS: the invitation acceptance endpoint is rate limited", async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await accept(`invalid-token-${attempt}`);
    assert.equal(response.status, 400);
  }
  const blocked = await accept("A".repeat(43));
  assert.equal(blocked.status, 429);
  assert.equal(blocked.body.error, "RATE_LIMITED");
});
