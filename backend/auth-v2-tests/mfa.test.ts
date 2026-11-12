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
  PASSWORD,
  buildApp,
  cookieHeader,
  currentTotp,
  extractCookie,
  getSession,
  listSessions,
  login,
  resetDb,
  seedUser,
  setCookieLines,
  stepUp,
} from "./helpers.js";

const { app } = buildApp();

const ADMIN2_ID = "66666666-6666-4666-8666-666666666666";

beforeEach(async () => {
  await resetDb();
  await seedUser({
    id: OWNER_ID,
    email: "owner@spike.test",
    name: "Owner",
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

async function enrollMfa(cookie: string) {
  const enable = await request(app)
    .post(`${BASE_PATH}/two-factor/enable`)
    .set("Origin", ORIGIN)
    .set("Cookie", cookie)
    .send({ password: PASSWORD });
  assert.equal(enable.status, 200, JSON.stringify(enable.body));

  const uri = enable.body.totpURI as string;
  assert.ok(uri.startsWith("otpauth://totp/"));
  const backupCodes = enable.body.backupCodes as string[];
  assert.equal(backupCodes.length, 10);

  const verify = await request(app)
    .post(`${BASE_PATH}/two-factor/verify-totp`)
    .set("Origin", ORIGIN)
    .set("Cookie", cookie)
    .send({ code: await currentTotp(uri) });
  assert.equal(verify.status, 200, JSON.stringify(verify.body));

  const rotated = setCookieLines(verify).some((line) =>
    /(?:^|\s)(?:__Secure-)?nexus\.session_token=/.test(line),
  )
    ? extractCookie(verify)
    : cookie;

  return { enable, verify, uri, backupCodes, cookie: rotated };
}

async function signInWithTotp(email: string, uri: string) {
  const challenge = await login(app, email);
  assert.equal(challenge.mfaRedirect, true, JSON.stringify(challenge.res.body));
  assert.equal(challenge.cookie, undefined);

  const cookies = cookieHeader(challenge.res);
  assert.match(cookies, /two_factor/);

  const verify = await request(app)
    .post(`${BASE_PATH}/two-factor/verify-totp`)
    .set("Origin", ORIGIN)
    .set("Cookie", cookies)
    .send({ code: await currentTotp(uri) });

  return { challenge, verify, cookie: extractCookie(verify) };
}

test("PASS: TOTP enrollment stores an encrypted secret and requires verification", async () => {
  const loginResult = await login(app, "owner@spike.test");
  assert.ok(loginResult.cookie);

  const enrolled = await enrollMfa(loginResult.cookie!);
  assert.equal(enrolled.enable.body.method, "totp");
  assert.doesNotMatch(JSON.stringify(enrolled.enable.body), /"token"/);

  const row = await authV2Prisma.twoFactor.findFirstOrThrow({
    where: { userId: OWNER_ID },
  });
  assert.equal(row.verified, true);
  assert.notEqual(row.secret, enrolled.uri);
  assert.ok(row.secret.length > 20);

  const user = await authV2Prisma.appUser.findUniqueOrThrow({
    where: { id: OWNER_ID },
  });
  assert.equal(user.twoFactorEnabled, true);

  // The verification response must not expose the session token either.
  assert.doesNotMatch(JSON.stringify(enrolled.verify.body), /"token"/);
  assert.equal((await getSession(app, enrolled.cookie)).body.user.id, OWNER_ID);
});

test("PASS: sign-in requires TOTP after enrollment and rejects a wrong code", async () => {
  const loginResult = await login(app, "owner@spike.test");
  const enrolled = await enrollMfa(loginResult.cookie!);

  const challenge = await login(app, "owner@spike.test");
  assert.equal(challenge.mfaRedirect, true);
  assert.equal(challenge.cookie, undefined);

  const cookies = cookieHeader(challenge.res);
  const wrong = await request(app)
    .post(`${BASE_PATH}/two-factor/verify-totp`)
    .set("Origin", ORIGIN)
    .set("Cookie", cookies)
    .send({ code: "000000" });
  assert.equal(wrong.status, 401, JSON.stringify(wrong.body));

  const valid = await request(app)
    .post(`${BASE_PATH}/two-factor/verify-totp`)
    .set("Origin", ORIGIN)
    .set("Cookie", cookies)
    .send({ code: await currentTotp(enrolled.uri) });
  assert.equal(valid.status, 200, JSON.stringify(valid.body));
  assert.doesNotMatch(JSON.stringify(valid.body), /"token"/);

  const session = await getSession(app, extractCookie(valid));
  assert.equal(session.status, 200, JSON.stringify(session.body));
  assert.equal(session.body.user.id, OWNER_ID);
});

test("PASS: a backup code creates a session once and is then consumed", async () => {
  const loginResult = await login(app, "owner@spike.test");
  const enrolled = await enrollMfa(loginResult.cookie!);
  const backupCode = enrolled.backupCodes[0]!;

  const challenge = await login(app, "owner@spike.test");
  assert.equal(challenge.mfaRedirect, true);
  const cookies = cookieHeader(challenge.res);

  const first = await request(app)
    .post(`${BASE_PATH}/two-factor/verify-backup-code`)
    .set("Origin", ORIGIN)
    .set("Cookie", cookies)
    .send({ code: backupCode });
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.doesNotMatch(JSON.stringify(first.body), /"token"/);
  const sessionCookie = extractCookie(first);
  assert.equal((await getSession(app, sessionCookie)).body.user.id, OWNER_ID);

  // Replay with a fresh challenge must fail.
  const secondChallenge = await login(app, "owner@spike.test");
  const replay = await request(app)
    .post(`${BASE_PATH}/two-factor/verify-backup-code`)
    .set("Origin", ORIGIN)
    .set("Cookie", cookieHeader(secondChallenge.res))
    .send({ code: backupCode });
  assert.equal(replay.status, 401, JSON.stringify(replay.body));
});

test("PASS: TOTP verification and list-sessions responses never leak tokens", async () => {
  const loginResult = await login(app, "owner@spike.test");
  const enrolled = await enrollMfa(loginResult.cookie!);

  const list = await listSessions(app, enrolled.cookie);
  assert.equal(list.status, 200, JSON.stringify(list.body));
  const body = JSON.stringify(list.body);
  assert.doesNotMatch(body, /"token"/);

  const signIn = await signInWithTotp("owner@spike.test", enrolled.uri);
  const verifyBody = JSON.stringify(signIn.verify.body);
  assert.doesNotMatch(verifyBody, /"token"/);
});

test("PASS: an ADMIN can require MFA for a manageable user during a grace period", async () => {
  const admin = await login(app, "admin@spike.test");
  const employee = await login(app, "employee@spike.test");
  assert.ok(admin.cookie && employee.cookie);
  assert.equal((await stepUp(app, admin.cookie!)).status, 200);

  const policy = await request(app)
    .patch(`${BASE_PATH}/admin/users/${EMPLOYEE_ID}/mfa`)
    .set("Origin", ORIGIN)
    .set("Cookie", admin.cookie!)
    .send({ required: true });
  assert.equal(policy.status, 200, JSON.stringify(policy.body));
  assert.equal(policy.body.user.twoFactorRequired, true);

  // Within the grace period the employee can still sign in.
  const stillAllowed = await login(app, "employee@spike.test");
  assert.equal(stillAllowed.res.status, 200, JSON.stringify(stillAllowed.res.body));

  const status = await request(app)
    .get(`${BASE_PATH}/mfa/policy`)
    .set("Cookie", stillAllowed.cookie!);
  assert.equal(status.status, 200, JSON.stringify(status.body));
  assert.equal(status.body.required, true);
  assert.equal(status.body.enabled, false);
  assert.equal(status.body.enrollmentOverdue, false);
  assert.ok(status.body.deadline);
});

test("PASS: MFA enforcement blocks access and new sessions after the grace period", async () => {
  await authV2Prisma.appUser.update({
    where: { id: EMPLOYEE_ID },
    data: {
      twoFactorRequired: true,
      twoFactorEnforcedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
  });

  const blockedLogin = await login(app, "employee@spike.test");
  assert.notEqual(blockedLogin.res.status, 200);
  assert.equal(blockedLogin.cookie, undefined);
  assert.equal(
    await authV2Prisma.session.count({ where: { userId: EMPLOYEE_ID } }),
    0,
  );
});

test("PASS: a user under an overdue MFA requirement can still enroll and regain access", async () => {
  const employee = await login(app, "employee@spike.test");
  assert.ok(employee.cookie);

  await authV2Prisma.appUser.update({
    where: { id: EMPLOYEE_ID },
    data: {
      twoFactorRequired: true,
      twoFactorEnforcedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
  });

  const denied = await request(app)
    .get(`${BASE_PATH}/account/me`)
    .set("Cookie", employee.cookie!);
  assert.equal(denied.status, 403, JSON.stringify(denied.body));
  assert.equal(denied.body.error, "MFA_ENROLLMENT_REQUIRED");

  // The better-auth enrollment endpoint still works from the existing session.
  const enrolled = await enrollMfa(employee.cookie!);
  const me = await request(app)
    .get(`${BASE_PATH}/account/me`)
    .set("Cookie", enrolled.cookie);
  assert.equal(me.status, 200, JSON.stringify(me.body));
  assert.equal(me.body.user.twoFactorEnabled, true);
});

test("PASS: an ADMIN cannot impose MFA on an OWNER or another ADMIN", async () => {
  const admin = await login(app, "admin@spike.test");
  assert.ok(admin.cookie);
  assert.equal((await stepUp(app, admin.cookie!)).status, 200);

  const targetOwner = await request(app)
    .patch(`${BASE_PATH}/admin/users/${OWNER_ID}/mfa`)
    .set("Origin", ORIGIN)
    .set("Cookie", admin.cookie!)
    .send({ required: true });
  assert.equal(targetOwner.status, 403);

  const targetAdmin = await request(app)
    .patch(`${BASE_PATH}/admin/users/${ADMIN2_ID}/mfa`)
    .set("Origin", ORIGIN)
    .set("Cookie", admin.cookie!)
    .send({ required: true });
  assert.equal(targetAdmin.status, 403);
});

test("PASS: disabling MFA requires the password and removes the factor", async () => {
  const loginResult = await login(app, "owner@spike.test");
  const enrolled = await enrollMfa(loginResult.cookie!);

  const wrong = await request(app)
    .post(`${BASE_PATH}/two-factor/disable`)
    .set("Origin", ORIGIN)
    .set("Cookie", enrolled.cookie)
    .send({ password: "Wrong-Password-2026" });
  assert.equal(wrong.status, 400, JSON.stringify(wrong.body));

  const disable = await request(app)
    .post(`${BASE_PATH}/two-factor/disable`)
    .set("Origin", ORIGIN)
    .set("Cookie", enrolled.cookie)
    .send({ password: PASSWORD });
  assert.equal(disable.status, 200, JSON.stringify(disable.body));

  const user = await authV2Prisma.appUser.findUniqueOrThrow({
    where: { id: OWNER_ID },
  });
  assert.equal(user.twoFactorEnabled, false);
  assert.equal(
    await authV2Prisma.twoFactor.count({ where: { userId: OWNER_ID } }),
    0,
  );

  const nextLogin = await login(app, "owner@spike.test");
  assert.equal(nextLogin.res.status, 200, JSON.stringify(nextLogin.res.body));
  assert.equal(nextLogin.mfaRedirect, false);
});
