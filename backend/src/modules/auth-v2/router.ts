import { completeFirstPassword, readFirstPasswordPolicy, requestFirstPassword } from "./first-password.js";
import { deliverFirstPasswordEmail } from "./email.js";
import { verify } from "@node-rs/argon2";
import { Router, json, type NextFunction, type Request, type Response } from "express";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import type { AuthV2Auth } from "./auth.js";
import { ARGON2_OPTIONS, type AuthV2RuntimeConfig } from "./config.js";
import {
  acceptInvitation,
  createInvitation,
  revokeInvitation,
} from "./invitations.js";
import {
  ADMIN_MANAGEABLE_ROLES,
  canManageTarget,
  isRole,
  PolicyError,
  transferOwnership,
  updateUserAs,
} from "./permissions.js";
import { authV2Prisma } from "./prisma.js";
import { sanitizeAuthV2Json } from "./response-sanitizer.js";
import {
  clientMeta,
  LoginRateLimiter,
  logSecurityEvent,
  normalizeEmail,
} from "./security.js";
import {
  getValidatedSession,
  isMfaEnrollmentOverdue,
  sessionPolicyFromConfig,
  type ValidatedSession,
} from "./session.js";

export type AuthV2RouterOptions = {
  auth: AuthV2Auth;
  config: AuthV2RuntimeConfig;
  loginLimiter?: LoginRateLimiter;
  invitationLimiter?: LoginRateLimiter;
};

type AuthV2Locals = { authV2?: ValidatedSession };

function getAuthV2(res: Response): ValidatedSession {
  const locals = res.locals as AuthV2Locals;
  if (!locals.authV2) {
    throw new PolicyError("UNAUTHENTICATED", 401);
  }
  return locals.authV2;
}

function isTrustedOrigin(req: Request, config: AuthV2RuntimeConfig): boolean {
  const origin = req.get("origin");
  if (!origin) return false;
  return config.trustedOrigins.includes(origin);
}

function errorResponse(res: Response, error: unknown): Response {
  if (error instanceof PolicyError) {
    return res.status(error.status).json({ error: error.code });
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      statusCode?: unknown;
      status?: unknown;
      body?: { code?: unknown; message?: unknown };
    };
    const status =
      typeof candidate.statusCode === "number"
        ? candidate.statusCode
        : typeof candidate.status === "number"
          ? candidate.status
          : undefined;
    if (status !== undefined) {
      return res.status(status).json({
        error:
          typeof candidate.body?.code === "string"
            ? candidate.body.code
            : "AUTH_ERROR",
      });
    }
  }

  return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
}

export function createAuthV2Router(options: AuthV2RouterOptions): Router {
  const { auth, config } = options;
  const router = Router();
  const policy = sessionPolicyFromConfig(config);
  // Body parsing is applied per custom route so better-auth's catch-all still
  // receives the untouched raw request stream.
  const parseJson = json({ limit: "100kb" });

  const loginLimiter =
    options.loginLimiter ??
    new LoginRateLimiter({
      windowMs: config.loginRateLimit.windowMs,
      maxFailures: config.loginRateLimit.maxFailures,
      blockMs: config.loginRateLimit.blockMs,
    });

  const ipLimiter = new LoginRateLimiter({
    windowMs: config.loginRateLimit.windowMs,
    maxFailures: config.loginRateLimit.maxFailuresPerIp,
    blockMs: config.loginRateLimit.blockMs,
  });

  const invitationLimiter =
    options.invitationLimiter ??
    new LoginRateLimiter({ windowMs: 60_000, maxFailures: 10, blockMs: 15 * 60_000 });

  // ---------------------------------------------------------------------
  // Global response sanitisation + same-origin enforcement for every route.
  // `toNodeHandler` also checks Origin; doing it here covers the custom
  // endpoints and rejects origin-less browser state changes early.
  // ---------------------------------------------------------------------
  router.use(sanitizeAuthV2Json());
  router.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      return next();
    }
    if (!isTrustedOrigin(req, config)) {
      return res.status(403).json({ error: "INVALID_ORIGIN" });
    }
    next();
  });

  const requireSession = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const result = await getValidatedSession(auth, req, policy);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.reason });
    }
    (res.locals as AuthV2Locals).authV2 = result;
    next();
  };

  const requireRole =
    (...roles: string[]) =>
    (_req: Request, res: Response, next: NextFunction) => {
      const actor = getAuthV2(res).user;
      if (!roles.includes(actor.role)) {
        return res.status(403).json({ error: "INSUFFICIENT_PERMISSIONS" });
      }
      next();
    };

  const hasRecentAuth = (res: Response): boolean => {
    const at = getAuthV2(res).session.reauthenticatedAt?.getTime();
    return at !== undefined && Date.now() - at <= config.reauthMaxAgeMs;
  };

  const requireRecentAuth = (
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!hasRecentAuth(res)) {
      return res.status(403).json({ error: "REAUTH_REQUIRED" });
    }
    next();
  };

  // ---------------------------------------------------------------------
  // Account/session endpoints
  // ---------------------------------------------------------------------
  router.get("/account/me", requireSession, (_req, res) => {
    const { user, session } = getAuthV2(res);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorRequired: user.twoFactorRequired,
      },
      session: {
        id: session.id,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        reauthenticatedAt: session.reauthenticatedAt,
      },
    });
  });

  router.post("/account/step-up", parseJson, requireSession, async (req, res) => {
    const { user, session } = getAuthV2(res);
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!password) return res.status(400).json({ error: "PASSWORD_REQUIRED" });

    const account = await authV2Prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
      select: { password: true },
    });

    const valid =
      typeof account?.password === "string" &&
      (await verify(account.password, password, ARGON2_OPTIONS).catch(() => false));

    if (!valid) {
      await logSecurityEvent({
        eventType: "STEP_UP_FAILED",
        actorId: user.id,
        ...clientMeta(req),
      });
      return res.status(401).json({ error: "INVALID_CREDENTIALS" });
    }

    await authV2Prisma.session.update({
      where: { id: session.id },
      data: { reauthenticatedAt: new Date() },
    });
    await logSecurityEvent({
      eventType: "STEP_UP_SUCCESS",
      actorId: user.id,
      ...clientMeta(req),
    });

    return res.json({ status: true });
  });

  router.get("/sessions", requireSession, async (_req, res) => {
    const { user, session } = getAuthV2(res);
    const sessions = await authV2Prisma.session.findMany({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        updatedAt: true,
        lastSeenAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      currentSessionId: session.id,
      sessions,
    });
  });

  /**
   * Secure revocation by session ID.
   * - A user may revoke their own sessions.
   * - OWNER/ADMIN may revoke sessions of users they are allowed to manage,
   *   but only after a recent step-up reauthentication.
   * - The session token is never accepted from the client.
   */
  router.post("/sessions/:id/revoke", requireSession, async (req, res) => {
    const actor = getAuthV2(res);
    const sessionId = String(req.params.id);

    const target = await authV2Prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true },
    });
    if (!target) return res.status(404).json({ error: "SESSION_NOT_FOUND" });

    if (target.userId !== actor.user.id) {
      if (actor.user.role !== "OWNER" && actor.user.role !== "ADMIN") {
        return res.status(403).json({ error: "INSUFFICIENT_PERMISSIONS" });
      }
      const targetUser = await authV2Prisma.appUser.findUnique({
        where: { id: target.userId },
        select: { role: true },
      });
      if (!targetUser) {
        return res.status(404).json({ error: "USER_NOT_FOUND" });
      }
      if (!canManageTarget(actor.user.role, targetUser.role)) {
        return res.status(403).json({ error: "INSUFFICIENT_PERMISSIONS" });
      }
      if (!hasRecentAuth(res)) {
        return res.status(403).json({ error: "REAUTH_REQUIRED" });
      }
    }

    await authV2Prisma.session.deleteMany({ where: { id: sessionId } });
    await logSecurityEvent({
      eventType: "SESSION_REVOKED",
      actorId: actor.user.id,
      targetId: target.userId,
      ...clientMeta(req),
      metadata: { sessionId },
    });

    return res.json({ revoked: 1 });
  });

  router.post("/sessions/revoke-others", requireSession, async (req, res) => {
    const { user, session } = getAuthV2(res);
    const result = await authV2Prisma.session.deleteMany({
      where: { userId: user.id, id: { not: session.id } },
    });
    await logSecurityEvent({
      eventType: "OTHER_SESSIONS_REVOKED",
      actorId: user.id,
      ...clientMeta(req),
      metadata: { count: result.count },
    });
    return res.json({ revoked: result.count });
  });

  // ---------------------------------------------------------------------
  // MFA policy
  // ---------------------------------------------------------------------
  router.get("/mfa/policy", requireSession, (_req, res) => {
    const { user } = getAuthV2(res);
    const overdue = isMfaEnrollmentOverdue(
      user,
      config.mfaEnforcementGraceMs,
    );
    res.json({
      required: user.twoFactorRequired,
      enabled: user.twoFactorEnabled,
      enforcedAt: user.twoFactorEnforcedAt,
      deadline: user.twoFactorEnforcedAt
        ? new Date(
            user.twoFactorEnforcedAt.getTime() + config.mfaEnforcementGraceMs,
          )
        : null,
      enrollmentOverdue: overdue,
    });
  });

  router.patch(
    "/admin/users/:id/mfa",
    parseJson,
    requireSession,
    requireRole("OWNER", "ADMIN"),
    requireRecentAuth,
    async (req, res) => {
      const actor = getAuthV2(res).user;
      const targetId = String(req.params.id);
      const required = req.body?.required;

      if (typeof required !== "boolean") {
        return res.status(400).json({ error: "INVALID_REQUIREMENT" });
      }

      const target = await authV2Prisma.appUser.findUnique({
        where: { id: targetId },
        select: { id: true, role: true },
      });
      if (!target) return res.status(404).json({ error: "USER_NOT_FOUND" });

      if (target.id !== actor.id && !canManageTarget(actor.role, target.role)) {
        return res.status(403).json({ error: "INSUFFICIENT_PERMISSIONS" });
      }
      // Only an OWNER may impose MFA on an OWNER.
      if (target.role === "OWNER" && actor.role !== "OWNER") {
        return res.status(403).json({ error: "INSUFFICIENT_PERMISSIONS" });
      }

      const updated = await authV2Prisma.appUser.update({
        where: { id: targetId },
        data: {
          twoFactorRequired: required,
          twoFactorEnforcedAt: required ? new Date() : null,
        },
        select: {
          id: true,
          email: true,
          twoFactorRequired: true,
          twoFactorEnforcedAt: true,
        },
      });

      await logSecurityEvent({
        eventType: "MFA_POLICY_CHANGED",
        actorId: actor.id,
        targetId,
        ...clientMeta(req),
        metadata: { required },
      });

      return res.json({ user: updated });
    },
  );

  // ---------------------------------------------------------------------
  // Invitation-only onboarding
  // ---------------------------------------------------------------------
  router.post(
    "/invitations",
    parseJson,
    requireSession,
    requireRole("OWNER", "ADMIN"),
    requireRecentAuth,
    async (req, res) => {
      const actor = getAuthV2(res).user;
      const invitation = await createInvitation({
        actor,
        email: String(req.body?.email ?? ""),
        role: req.body?.role,
        meta: clientMeta(req),
        config,
      });

      return res.status(201).json({
        invitation,
        delivery: config.emailDeliveryEnabled ? "email" : "outbox",
      });
    },
  );

  router.get(
    "/invitations",
    requireSession,
    requireRole("OWNER", "ADMIN"),
    async (_req, res) => {
      const invitations = await authV2Prisma.invitation.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
          acceptedAt: true,
          revokedAt: true,
          createdAt: true,
        },
      });
      res.json({ invitations });
    },
  );

  router.post(
    "/invitations/:id/revoke",
    requireSession,
    requireRole("OWNER", "ADMIN"),
    requireRecentAuth,
    async (req, res) => {
      const actor = getAuthV2(res).user;
      const invitation = await revokeInvitation({
        actor,
        id: String(req.params.id),
        meta: clientMeta(req),
      });
      res.json({ invitation });
    },
  );

  router.post("/invitations/accept", parseJson, async (req, res) => {
    const key = `invite|${req.ip ?? "unknown"}`;
    const decision = invitationLimiter.check(key);
    if (!decision.allowed) {
      res.setHeader(
        "Retry-After",
        String(Math.ceil(decision.retryAfterMs / 1000)),
      );
      return res.status(429).json({ error: "RATE_LIMITED" });
    }

    try {
      const user = await acceptInvitation({
        token: String(req.body?.token ?? ""),
        name:
          typeof req.body?.name === "string" ? req.body.name : undefined,
        password: String(req.body?.password ?? ""),
        meta: clientMeta(req),
      });
      invitationLimiter.success(key);
      return res.status(201).json({ status: true, user });
    } catch (error) {
      invitationLimiter.fail(key);
      return errorResponse(res, error);
    }
  });

  // ---------------------------------------------------------------------
  // Administrative user management
  // ---------------------------------------------------------------------
  router.get(
    "/admin/users",
    requireSession,
    requireRole("OWNER", "ADMIN"),
    async (_req, res) => {
      const actor = getAuthV2(res).user;
      const where =
        actor.role === "OWNER"
          ? {}
          : {
              role: {
                in: [...ADMIN_MANAGEABLE_ROLES],
              },
            };

      const users = await authV2Prisma.appUser.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          twoFactorRequired: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return res.json({ users });
    },
  );

  router.patch(
    "/admin/users/:id",
    parseJson,
    requireSession,
    requireRole("OWNER", "ADMIN"),
    requireRecentAuth,
    async (req, res) => {
      const actor = getAuthV2(res).user;
      const role = req.body?.role;
      const isActive = req.body?.isActive;

      if (role !== undefined && !isRole(role)) {
        return res.status(400).json({ error: "INVALID_ROLE" });
      }
      if (isActive !== undefined && typeof isActive !== "boolean") {
        return res.status(400).json({ error: "INVALID_ACTIVE_FLAG" });
      }
      if (role === undefined && isActive === undefined) {
        return res.status(400).json({ error: "NO_CHANGES" });
      }

      try {
        const updated = await updateUserAs(
          actor,
          String(req.params.id),
          {
            ...(role !== undefined ? { role } : {}),
            ...(isActive !== undefined ? { isActive } : {}),
          },
          clientMeta(req),
        );
        return res.json({
          user: {
            id: updated.id,
            email: updated.email,
            role: updated.role,
            isActive: updated.isActive,
          },
        });
      } catch (error) {
        return errorResponse(res, error);
      }
    },
  );

  router.post(
    "/admin/owner/transfer",
    parseJson,
    requireSession,
    requireRole("OWNER"),
    requireRecentAuth,
    async (req, res) => {
      const actor = getAuthV2(res).user;
      const targetId = req.body?.targetId;
      if (typeof targetId !== "string" || targetId.length === 0) {
        return res.status(400).json({ error: "TARGET_REQUIRED" });
      }
      try {
        const result = await transferOwnership(actor, targetId, clientMeta(req));
        return res.json(result);
      } catch (error) {
        return errorResponse(res, error);
      }
    },
  );

  router.post(
    "/admin/users/:id/revoke-sessions",
    requireSession,
    requireRole("OWNER", "ADMIN"),
    requireRecentAuth,
    async (req, res) => {
      const actor = getAuthV2(res).user;
      const targetId = String(req.params.id);

      if (targetId !== actor.id) {
        const target = await authV2Prisma.appUser.findUnique({
          where: { id: targetId },
          select: { id: true, role: true, isActive: true },
        });
        if (!target) return res.status(404).json({ error: "USER_NOT_FOUND" });
        if (!canManageTarget(actor.role, target.role)) {
          return res.status(403).json({ error: "INSUFFICIENT_PERMISSIONS" });
        }
      }

      const result = await authV2Prisma.session.deleteMany({
        where: { userId: targetId },
      });
      await logSecurityEvent({
        eventType: "SESSIONS_REVOKED",
        actorId: actor.id,
        targetId,
        ...clientMeta(req),
        metadata: { count: result.count },
      });
      return res.json({ revoked: result.count });
    },
  );

  router.get(
    "/security-events",
    requireSession,
    requireRole("OWNER"),
    async (_req, res) => {
      const events = await authV2Prisma.securityEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          eventType: true,
          actorId: true,
          targetId: true,
          ip: true,
          userAgent: true,
          metadata: true,
          createdAt: true,
        },
      });
      res.json({ events });
    },
  );

  // ---------------------------------------------------------------------
  // Throttled credential endpoints
  // ---------------------------------------------------------------------
  router.post("/sign-in/email", parseJson, async (req, res) => {
    const email =
      typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !password) {
      return res.status(400).json({ error: "INVALID_REQUEST" });
    }

    const ipKey = `ip|${req.ip ?? "unknown"}`;
    const accountKey = `${req.ip ?? "unknown"}|${email}`;
    const accountDecision = loginLimiter.check(accountKey);
    const ipDecision = ipLimiter.check(ipKey);

    if (!accountDecision.allowed || !ipDecision.allowed) {
      const retryAfterMs = Math.max(
        accountDecision.retryAfterMs,
        ipDecision.retryAfterMs,
      );
      res.setHeader("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
      await logSecurityEvent({
        eventType: "LOGIN_RATE_LIMITED",
        ip: req.ip ?? null,
        userAgent: req.get("user-agent") ?? null,
        metadata: {
          emailNormalized: email,
          scope: !accountDecision.allowed ? "account" : "ip",
        },
      });
      return res.status(429).json({
        error: "RATE_LIMITED",
        scope: !accountDecision.allowed ? "account" : "ip",
      });
    }

    try {
      const response = await auth.api.signInEmail({
        body: { email, password },
        headers: fromNodeHeaders(req.headers),
        asResponse: true,
      });

      for (const cookie of response.headers.getSetCookie()) {
        res.append("Set-Cookie", cookie);
      }
      res.status(response.status);

      if (response.status === 200) {
        loginLimiter.success(accountKey);
        ipLimiter.success(ipKey);
        await logSecurityEvent({
          eventType: "LOGIN_SUCCESS",
          ip: req.ip ?? null,
          userAgent: req.get("user-agent") ?? null,
          metadata: { emailNormalized: email },
        });
      } else {
        loginLimiter.fail(accountKey);
        ipLimiter.fail(ipKey);
        await logSecurityEvent({
          eventType: "LOGIN_FAILED",
          ip: req.ip ?? null,
          userAgent: req.get("user-agent") ?? null,
          metadata: { emailNormalized: email, status: response.status },
        });
      }

      const text = await response.text();
      return res
        .type(response.headers.get("content-type") ?? "application/json")
        .send(text);
    } catch {
      loginLimiter.fail(accountKey);
      ipLimiter.fail(ipKey);
      await logSecurityEvent({
        eventType: "LOGIN_FAILED",
        ip: req.ip ?? null,
        userAgent: req.get("user-agent") ?? null,
        metadata: { emailNormalized: email, status: "EXCEPTION" },
      });
      return res.status(401).json({ error: "INVALID_CREDENTIALS" });
    }
  });

  // Neue Kontoverknüpfung bleibt standardmäßig aus; vorhandene Recovery-Endpunkte bleiben unverändert.
  const firstPasswordPolicy = readFirstPasswordPolicy(config.appURL);
  const setupAccountLimiter = new LoginRateLimiter({ windowMs: 15 * 60_000, maxFailures: 10, blockMs: 15 * 60_000 });
  for (const operation of ["request", "complete"] as const) {
    router.post(`/first-password/${operation}`, parseJson, async (req, res) => {
      if (!firstPasswordPolicy) return res.status(404).json({ error: "NOT_FOUND" });
      const key = `first-password|${req.ip ?? "unknown"}`;
      const decision = ipLimiter.check(key);
      const accountDecision = setupAccountLimiter.check(firstPasswordPolicy.userId);
      if (!decision.allowed || !accountDecision.allowed) {
        res.setHeader("Retry-After", String(Math.ceil(Math.max(decision.retryAfterMs, accountDecision.retryAfterMs) / 1000)));
        return res.status(429).json({ error: "RATE_LIMITED" });
      }
      ipLimiter.fail(key);
      // Auch verteilte IPs dürfen das fest konfigurierte OWNER-Postfach nicht unbegrenzt anschreiben.
      setupAccountLimiter.fail(firstPasswordPolicy.userId);
      try {
        if (operation === "request") return res.json(await requestFirstPassword(authV2Prisma, typeof req.body?.email === "string" ? req.body.email : "", firstPasswordPolicy, deliverFirstPasswordEmail));
        return res.json(await completeFirstPassword(authV2Prisma, {
          token: typeof req.body?.token === "string" ? req.body.token : "",
          newPassword: typeof req.body?.newPassword === "string" ? req.body.newPassword : "",
        }, firstPasswordPolicy));
      } catch (error) { return errorResponse(res, error); }
    });
  }

  router.post("/request-password-reset", parseJson, async (req, res) => {
    const email =
      typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
    const ipKey = `reset-ip|${req.ip ?? "unknown"}`;
    const decision = ipLimiter.check(ipKey);
    if (!decision.allowed) {
      res.setHeader("Retry-After", String(Math.ceil(decision.retryAfterMs / 1000)));
      return res.status(429).json({ error: "RATE_LIMITED" });
    }

    try {
      const body: { email: string; redirectTo?: string } = { email };
      if (req.body?.redirectTo === undefined) {
        body.redirectTo = `${config.appURL}/auth-v2/reset-password`;
      } else if (typeof req.body.redirectTo === "string") {
        body.redirectTo = req.body.redirectTo;
      }

      const response = await auth.api.requestPasswordReset({
        body,
        headers: fromNodeHeaders(req.headers),
        asResponse: true,
      });
      const text = await response.text();
      // Count every request against the per-IP auth budget so enumeration and
      // mail-flooding attempts are both throttled.
      ipLimiter.fail(ipKey);
      return res
        .status(response.status)
        .type(response.headers.get("content-type") ?? "application/json")
        .send(text);
    } catch {
      ipLimiter.fail(ipKey);
      return errorResponse(res, null);
    }
  });

  router.get("/health", (_req, res) => {
    res.json({ status: "ready", module: "auth-v2" });
  });

  // better-auth owns every remaining endpoint (sign-out, get-session,
  // list-sessions, change-password, reset-password, two-factor/*).
  router.all("/*splat", toNodeHandler(auth));

  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (!res.headersSent) errorResponse(res, error);
  });

  return router;
}
