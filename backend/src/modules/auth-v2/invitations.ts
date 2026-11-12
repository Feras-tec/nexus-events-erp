import { randomBytes, randomUUID } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { z } from "zod";
import { ARGON2_OPTIONS, type AuthV2RuntimeConfig } from "./config.js";
import { deliverInvitationEmail } from "./email.js";
import {
  canAssignRole,
  isRole,
  PolicyError,
  type Actor,
  type RequestMeta,
  type Role,
} from "./permissions.js";
import { authV2Prisma } from "./prisma.js";
import { logSecurityEvent, normalizeEmail } from "./security.js";
import { hashInvitationToken } from "./token-hash.js";

const emailSchema = z.string().trim().email().max(320);
const nameSchema = z.string().trim().min(1).max(120);
const passwordSchema = z.string().min(12).max(128);

function prismaErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

export type CreateInvitationInput = {
  actor: Actor;
  email: string;
  role: unknown;
  meta?: RequestMeta;
  config: AuthV2RuntimeConfig;
};

export async function createInvitation(input: CreateInvitationInput) {
  if (input.actor.role !== "OWNER" && input.actor.role !== "ADMIN") {
    throw new PolicyError("INSUFFICIENT_PERMISSIONS", 403);
  }

  const parsedEmail = emailSchema.safeParse(input.email);
  if (!parsedEmail.success) {
    throw new PolicyError("INVALID_EMAIL", 400);
  }
  if (!isRole(input.role)) {
    throw new PolicyError("INVALID_ROLE", 400);
  }
  if (!canAssignRole(input.actor.role, input.role)) {
    throw new PolicyError("INSUFFICIENT_PERMISSIONS", 403);
  }

  const normalized = normalizeEmail(parsedEmail.data);
  const existingUser = await authV2Prisma.appUser.findUnique({
    where: { email: normalized },
    select: { id: true },
  });
  if (existingUser) {
    throw new PolicyError("EMAIL_IN_USE", 409);
  }

  const now = new Date();
  const pending = await authV2Prisma.invitation.findFirst({
    where: {
      normalizedEmail: normalized,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    select: { id: true },
  });
  if (pending) {
    throw new PolicyError("INVITATION_ALREADY_PENDING", 409);
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + input.config.invitationTtlMs);

  let invitation;
  try {
    invitation = await authV2Prisma.invitation.create({
      data: {
        email: parsedEmail.data,
        normalizedEmail: normalized,
        role: input.role as Role,
        tokenHash: hashInvitationToken(token),
        invitedById: input.actor.id,
        expiresAt,
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  } catch (error) {
    if (prismaErrorCode(error) === "P2002") {
      throw new PolicyError("INVITATION_ALREADY_PENDING", 409);
    }
    throw error;
  }

  await logSecurityEvent({
    eventType: "INVITATION_CREATED",
    actorId: input.actor.id,
    ip: input.meta?.ip ?? null,
    userAgent: input.meta?.userAgent ?? null,
    metadata: { role: input.role, emailNormalized: normalized },
  });

  await deliverInvitationEmail(
    {
      invitationId: invitation.id,
      email: invitation.email,
      token,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    },
    `${input.config.appURL}/auth-v2/accept-invitation?token=${encodeURIComponent(token)}`,
  );

  return invitation;
}

export type AcceptInvitationInput = {
  token: string;
  name?: string;
  password: string;
  meta?: RequestMeta;
};

export async function acceptInvitation(input: AcceptInvitationInput) {
  if (typeof input.token !== "string" || input.token.length < 20) {
    throw new PolicyError("INVALID_INVITATION", 400);
  }

  const password = passwordSchema.safeParse(input.password);
  if (!password.success) {
    throw new PolicyError("WEAK_PASSWORD", 400);
  }

  const invitation = await authV2Prisma.invitation.findUnique({
    where: { tokenHash: hashInvitationToken(input.token) },
  });
  if (!invitation) throw new PolicyError("INVALID_INVITATION", 400);
  if (invitation.revokedAt) throw new PolicyError("INVITATION_REVOKED", 400);
  if (invitation.acceptedAt) throw new PolicyError("INVITATION_ALREADY_USED", 400);
  if (invitation.expiresAt.getTime() <= Date.now()) {
    throw new PolicyError("INVITATION_EXPIRED", 400);
  }

  const normalized = normalizeEmail(invitation.email);
  const existing = await authV2Prisma.appUser.findUnique({
    where: { email: normalized },
    select: { id: true },
  });
  if (existing) throw new PolicyError("EMAIL_IN_USE", 409);

  const providedName =
    input.name === undefined ? "" : nameSchema.safeParse(input.name);
  const fallbackName = normalized.split("@")[0] ?? "Mitarbeiter";
  const displayName =
    providedName === "" || !providedName.success
      ? fallbackName
      : providedName.data;

  const passwordHash = await hash(password.data, ARGON2_OPTIONS);
  const userId = randomUUID();

  let user;
  try {
    user = await authV2Prisma.$transaction(async (tx) => {
      const created = await tx.appUser.create({
        data: {
          id: userId,
          email: normalized,
          name: displayName,
          emailVerified: true,
          role: invitation.role,
          isActive: true,
          clerkUserId: null,
          accounts: {
            create: {
              providerId: "credential",
              accountId: userId,
              password: passwordHash,
            },
          },
        },
        select: { id: true, email: true, name: true, role: true },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      await tx.securityEvent.create({
        data: {
          eventType: "INVITATION_ACCEPTED",
          actorId: created.id,
          targetId: created.id,
          ip: input.meta?.ip ?? null,
          userAgent: input.meta?.userAgent ?? null,
          metadata: { role: created.role },
        },
      });

      return created;
    });
  } catch (error) {
    if (prismaErrorCode(error) === "P2002") {
      throw new PolicyError("EMAIL_IN_USE", 409);
    }
    throw error;
  }

  return user;
}

export async function revokeInvitation(input: {
  actor: Actor;
  id: string;
  meta?: RequestMeta;
}) {
  if (input.actor.role !== "OWNER" && input.actor.role !== "ADMIN") {
    throw new PolicyError("INSUFFICIENT_PERMISSIONS", 403);
  }

  const invitation = await authV2Prisma.invitation.findUnique({
    where: { id: input.id },
  });
  if (!invitation) throw new PolicyError("INVITATION_NOT_FOUND", 404);
  if (invitation.acceptedAt) {
    throw new PolicyError("INVITATION_ALREADY_USED", 409);
  }

  const updated = await authV2Prisma.invitation.update({
    where: { id: input.id },
    data: { revokedAt: invitation.revokedAt ?? new Date() },
    select: { id: true, email: true, revokedAt: true },
  });

  await logSecurityEvent({
    eventType: "INVITATION_REVOKED",
    actorId: input.actor.id,
    ip: input.meta?.ip ?? null,
    userAgent: input.meta?.userAgent ?? null,
    metadata: { invitationId: input.id },
  });

  return updated;
}
