import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import type { AuthV2Auth } from "./auth.js";
import type { AuthV2RuntimeConfig } from "./config.js";
import { authV2Prisma } from "./prisma.js";

export type ValidatedUser = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  name: string;
  twoFactorEnabled: boolean;
  twoFactorRequired: boolean;
  twoFactorEnforcedAt: Date | null;
};

export type ValidatedSession = {
  ok: true;
  session: {
    id: string;
    userId: string;
    createdAt: Date;
    expiresAt: Date;
    reauthenticatedAt: Date | null;
    lastSeenAt: Date | null;
    ipAddress: string | null;
    userAgent: string | null;
  };
  user: ValidatedUser;
};

export type SessionFailureReason =
  | "UNAUTHENTICATED"
  | "ABSOLUTE_EXPIRED"
  | "IDLE_EXPIRED"
  | "ACCOUNT_INACTIVE"
  | "MFA_ENROLLMENT_REQUIRED";

export type SessionFailure = {
  ok: false;
  reason: SessionFailureReason;
  status: 401 | 403;
};

export type SessionPolicy = {
  absoluteMs: number;
  idleMs: number;
  mfaGraceMs: number;
  touchIntervalMs?: number;
};

export function sessionPolicyFromConfig(
  config: AuthV2RuntimeConfig,
): SessionPolicy {
  return {
    absoluteMs: config.absoluteMs,
    idleMs: config.idleSeconds * 1000,
    mfaGraceMs: config.mfaEnforcementGraceMs,
  };
}

export function isMfaEnrollmentOverdue(
  user: Pick<
    ValidatedUser,
    "twoFactorRequired" | "twoFactorEnabled" | "twoFactorEnforcedAt"
  >,
  graceMs: number,
  now = Date.now(),
): boolean {
  if (!user.twoFactorRequired || user.twoFactorEnabled) return false;
  if (!user.twoFactorEnforcedAt) return true;
  return now - user.twoFactorEnforcedAt.getTime() > graceMs;
}

/**
 * Reads the authoritative session row and applies policies better-auth does
 * not enforce natively:
 *  - absolute lifetime based on immutable createdAt
 *  - strict idle lifetime based on lastSeenAt
 *  - account activation state
 *  - administrative MFA enrollment deadline
 */
export async function getValidatedSession(
  auth: AuthV2Auth,
  req: Request,
  policy: SessionPolicy,
): Promise<ValidatedSession | SessionFailure> {
  const result = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!result) return { ok: false, reason: "UNAUTHENTICATED", status: 401 };

  const dbSession = await authV2Prisma.session.findUnique({
    where: { id: result.session.id },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      expiresAt: true,
      reauthenticatedAt: true,
      lastSeenAt: true,
      ipAddress: true,
      userAgent: true,
    },
  });
  if (!dbSession) return { ok: false, reason: "UNAUTHENTICATED", status: 401 };

  const now = Date.now();
  if (now - dbSession.createdAt.getTime() > policy.absoluteMs) {
    await authV2Prisma.session.deleteMany({ where: { id: dbSession.id } });
    return { ok: false, reason: "ABSOLUTE_EXPIRED", status: 401 };
  }

  const lastSeen = (dbSession.lastSeenAt ?? dbSession.createdAt).getTime();
  if (now - lastSeen > policy.idleMs) {
    await authV2Prisma.session.deleteMany({ where: { id: dbSession.id } });
    return { ok: false, reason: "IDLE_EXPIRED", status: 401 };
  }

  const user = await authV2Prisma.appUser.findUnique({
    where: { id: dbSession.userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      name: true,
      twoFactorEnabled: true,
      twoFactorRequired: true,
      twoFactorEnforcedAt: true,
    },
  });
  if (!user || !user.isActive) {
    await authV2Prisma.session.deleteMany({
      where: { userId: dbSession.userId },
    });
    return { ok: false, reason: "ACCOUNT_INACTIVE", status: 401 };
  }

  if (isMfaEnrollmentOverdue(user, policy.mfaGraceMs, now)) {
    return { ok: false, reason: "MFA_ENROLLMENT_REQUIRED", status: 403 };
  }

  const touchInterval = policy.touchIntervalMs ?? 60_000;
  if (now - lastSeen > touchInterval) {
    await authV2Prisma.session
      .update({
        where: { id: dbSession.id },
        data: { lastSeenAt: new Date(now) },
      })
      .catch(() => undefined);
  }

  return {
    ok: true,
    session: dbSession,
    user: {
      id: user.id,
      email: user.email ?? "",
      role: user.role,
      isActive: user.isActive,
      name: user.name,
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorRequired: user.twoFactorRequired,
      twoFactorEnforcedAt: user.twoFactorEnforcedAt,
    },
  };
}
