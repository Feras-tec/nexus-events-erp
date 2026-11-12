import { createHash, randomBytes, randomUUID } from "node:crypto";
import { hash } from "@node-rs/argon2";
import type { PrismaClient, Prisma } from "../../generated/prisma/client.js";
import { ARGON2_OPTIONS } from "./config.js";
import { PolicyError } from "./permissions.js";

export type FirstPasswordPolicy = { userId: string; email: string; appURL: string };
export type SetupDelivery = (input: { email: string; url: string }) => Promise<void>;
const tokenIdentifier = (token: string) => `first-password:${createHash("sha256").update(token).digest("hex")}`;
const binding = (policy: FirstPasswordPolicy) => JSON.stringify({ userId: policy.userId, email: policy.email });

// Ohne ausdrücklich freigegebene Konfiguration bleibt dieser bestehende-Konto-Pfad geschlossen.
export function readFirstPasswordPolicy(appURL: string, env = process.env): FirstPasswordPolicy | undefined {
  const enabled = env.AUTH_V2_FIRST_PASSWORD_ENABLED;
  if (enabled !== undefined && enabled !== "true" && enabled !== "false") throw new Error("Invalid first-password enable flag");
  if (enabled !== "true") return undefined;
  const userId = env.AUTH_V2_FIRST_PASSWORD_USER_ID;
  const email = env.AUTH_V2_FIRST_PASSWORD_EMAIL;
  const url = new URL(appURL);
  if (!userId || !email || email !== email.trim().toLowerCase() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      env.AUTH_V2_EMAIL_DELIVERY_ENABLED !== "true" || !env.RESEND_API_KEY || !env.EMAIL_FROM ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) || url.username || url.password || url.search || url.hash) {
    throw new Error("Explicit OWNER identity and real email delivery are required for first-password setup");
  }
  return { userId, email, appURL: url.origin };
}
async function lockEligibleOwner(tx: Prisma.TransactionClient, policy: FirstPasswordPolicy) {
  // Alle eigenen Ausgaben/Einlösungen desselben Kontos serialisieren; keine Benutzeranlage oder Rollenänderung.
  await tx.$executeRaw`SELECT id FROM "AppUser" WHERE id = ${policy.userId} FOR UPDATE`;
  const user = await tx.appUser.findUnique({ where: { id: policy.userId } });
  if (!user || user.email !== policy.email || user.role !== "OWNER" || !user.isActive || !user.clerkUserId) throw new PolicyError("FIRST_PASSWORD_UNAVAILABLE", 409);
  if (await tx.account.findFirst({ where: { userId: user.id, providerId: "credential" }, select: { id: true } })) throw new PolicyError("FIRST_PASSWORD_UNAVAILABLE", 409);
  return user;
}
export async function requestFirstPassword(db: PrismaClient, email: string, policy: FirstPasswordPolicy, deliver: SetupDelivery) {
  // Öffentliche Antworten erlauben keine Unterscheidung zwischen unbekannten und bereits eingerichteten Konten.
  if (email.trim().toLowerCase() !== policy.email) return { status: true };
  const token = randomBytes(32).toString("hex");
  const identifier = tokenIdentifier(token);
  try {
    await db.$transaction(async tx => {
      await lockEligibleOwner(tx, policy);
      await tx.verification.deleteMany({ where: { identifier: { startsWith: "first-password:" }, value: binding(policy) } });
      await tx.verification.create({ data: { id: randomUUID(), identifier, value: binding(policy), expiresAt: new Date(Date.now() + 15 * 60_000) } });
    });
  } catch (error) {
    if (error instanceof PolicyError) return { status: true };
    throw error;
  }
  try {
    // Das Fragment wird nicht an Webserver gesendet; nur die echte Mailbox erhält den rohen Einmaltoken.
    await deliver({ email: policy.email, url: `${policy.appURL}/auth-v2/first-password#token=${token}` });
  } catch {
    await db.$transaction(async tx => {
      await tx.verification.deleteMany({ where: { identifier } });
      await tx.securityEvent.create({ data: { id: randomUUID(), eventType: "FIRST_PASSWORD_DELIVERY_FAILED", actorId: policy.userId } });
    });
    throw new PolicyError("FIRST_PASSWORD_DELIVERY_FAILED", 503);
  }
  return { status: true };
}
export async function completeFirstPassword(db: PrismaClient, input: { token: string; newPassword: string }, policy: FirstPasswordPolicy) {
  if (!/^[a-f0-9]{64}$/.test(input.token)) throw new PolicyError("INVALID_TOKEN", 400);
  if (input.newPassword.length < 12 || input.newPassword.length > 128) throw new PolicyError("INVALID_PASSWORD", 400);
  // Teure Passwortableitung außerhalb der Sperre; niemals Passwort oder Hash protokollieren.
  const password = await hash(input.newPassword, ARGON2_OPTIONS);
  try {
    await db.$transaction(async tx => {
      await lockEligibleOwner(tx, policy);
      const consumed = await tx.verification.deleteMany({ where: { identifier: tokenIdentifier(input.token), value: binding(policy), expiresAt: { gt: new Date() } } });
      if (consumed.count !== 1) throw new PolicyError("INVALID_TOKEN", 400);
      // Der kanonische Account-Schlüssel entspricht Better Auth; dessen konkurrierende Anlage kollidiert atomar.
      await tx.account.create({ data: { id: randomUUID(), userId: policy.userId, accountId: policy.userId, providerId: "credential", password } });
      await tx.appUser.update({ where: { id: policy.userId }, data: { emailVerified: true } });
      await tx.session.deleteMany({ where: { userId: policy.userId } });
      await tx.verification.deleteMany({ where: { identifier: { startsWith: "first-password:" }, value: binding(policy) } });
      await tx.securityEvent.create({ data: { id: randomUUID(), eventType: "FIRST_PASSWORD_COMPLETED", actorId: policy.userId } });
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw new PolicyError("FIRST_PASSWORD_UNAVAILABLE", 409);
    throw error;
  }
  // Kein automatischer Login: normale Anmeldung, MFA und RBAC bleiben erforderlich.
  return { status: true };
}
