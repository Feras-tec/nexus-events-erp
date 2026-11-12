import type { Request, Response, NextFunction } from "express";
import { getAuthMode } from "../auth/mode.js";
import type { UserRole } from "../generated/prisma/client.js";
import prisma from "../lib/prisma.js";

import {
  assertAuthV2Enabled,
  createAuthV2,
  readAuthV2Config,
} from "../modules/auth-v2/index.js";
import { getValidatedSession, sessionPolicyFromConfig, type SessionFailure } from "../modules/auth-v2/session.js";

type ResolvedAuth = {
  source: "clerk" | "auth-v2";
  auditUserId: string;
  appUser: {
    id: string;
    role: UserRole;
    isActive: boolean;
  };
};

// Fehler pro Anfrage speichern, damit MFA- und Ablaufgründe im ERP erhalten bleiben.
const sessionFailures = new WeakMap<Request, SessionFailure>();

let authV2Runtime:
  | {
      auth: ReturnType<typeof createAuthV2>;
      config: ReturnType<typeof readAuthV2Config>;
      policy: ReturnType<typeof sessionPolicyFromConfig>;
    }
  | null
  | undefined;

export function getAuthV2Runtime() {
  if (getAuthMode() !== "auth-v2") return null;
  if (authV2Runtime) return authV2Runtime;
  // Fehlerhafte Primärkonfiguration darf niemals still auf Clerk zurückfallen.
  const config = readAuthV2Config();
  assertAuthV2Enabled(config);
  authV2Runtime = { auth: createAuthV2(config), config, policy: sessionPolicyFromConfig(config) };
  return authV2Runtime;
}

// Pro Anfrage genau eine autoritative Auflösung für Limiter, RBAC und Audit wiederverwenden.
const resolvedRequests = new WeakMap<Request, Promise<ResolvedAuth | null>>();
async function resolveSelectedUser(req: Request): Promise<ResolvedAuth | null> {
  if (getAuthMode() === "clerk") {
    const { getAuth } = await import("@clerk/express");
    const clerk = getAuth(req);
    if (!clerk.isAuthenticated || !clerk.userId) return null;
    const appUser = await prisma.appUser.findUnique({where:{clerkUserId:clerk.userId},select:{id:true,role:true,isActive:true}});
    return appUser ? {source:"clerk",auditUserId:clerk.userId,appUser} : null;
  }
  const runtime = getAuthV2Runtime()!;
  const result = await getValidatedSession(runtime.auth, req, runtime.policy);
  if (!result.ok) { sessionFailures.set(req,result); return null; }
  const appUser = await prisma.appUser.findUnique({where:{id:result.user.id},select:{id:true,role:true,isActive:true}});
  return appUser?.isActive ? {source:"auth-v2",auditUserId:result.user.id,appUser} : null;
}

export async function resolveAuthenticatedUser(
  req: Request,
): Promise<ResolvedAuth | null> {
  let pending = resolvedRequests.get(req);
  if (!pending) { pending = resolveSelectedUser(req); resolvedRequests.set(req,pending); }
  return pending;
}

// Zugriff nur für Benutzer mit erlaubten Rollen
export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resolved = await resolveAuthenticatedUser(req);

    if (!resolved) {
      const failure = sessionFailures.get(req);
      if (failure) return res.status(failure.status).json({ error: failure.reason });
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!resolved.appUser || !resolved.appUser.isActive) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    // Auth-v2 uses HttpOnly cookies, so state-changing ERP requests require a
    // trusted Origin. Clerk bearer-token requests are unaffected.
    const unsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(
      req.method.toUpperCase(),
    );
    if (resolved.source === "auth-v2" && unsafeMethod) {
      const origin = req.get("origin");
      const runtime = getAuthV2Runtime();
      if (!origin || !runtime?.config.trustedOrigins.includes(origin)) {
        return res.status(403).json({ error: "INVALID_ORIGIN" });
      }
    }

    if (!allowedRoles.includes(resolved.appUser.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
      });
    }

    (req as Request & { authV2User?: ResolvedAuth["appUser"]; authSource?: string }).authV2User =
      resolved.appUser;
    (req as Request & { authSource?: string }).authSource = resolved.source;
    next();
  };
}
