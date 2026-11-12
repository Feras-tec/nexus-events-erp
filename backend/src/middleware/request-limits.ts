import type { Express, Request } from "express";
import { getAuthMode } from "../auth/mode.js";
import { resolveAuthenticatedUser } from "./require-role.js";
import { ipKeyGenerator, rateLimit, type Options } from "express-rate-limit";

// Ohne ausdrücklich konfigurierte Proxy-Kette werden fremde Forwarding-Header nicht vertraut.
export function getTrustedProxyHops(value = process.env.TRUST_PROXY_HOPS): number {
  if (value === undefined) return 0;
  if (!/^(0|[1-9]\d*)$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error("TRUST_PROXY_HOPS must be a non-negative integer");
  }
  return Number(value);
}

type Scope = "read" | "write" | "auth" | "expensive";
const scopes: Scope[] = ["read", "write", "auth", "expensive"];

// Alle Budgets sind endlich und gelten pro Minute; Konten bleiben auch hinter wechselnden IPs begrenzt.
export const REQUEST_LIMIT_POLICY = {
  windowMs: 60_000,
  ipLimit: 6_000,
  ipScopes: { read: 6_000, write: 1_200, auth: 300, expensive: 120 },
  userScopes: { read: 1_200, write: 300, auth: 60, expensive: 20 },
  anonymousScopes: { read: 60, write: 20, auth: 20, expensive: 5 },
} as const;

type LimitOptions = {
  proxyHops?: number;
  windowMs?: number;
  ipLimit?: number;
  ipScopes?: Partial<Record<Scope, number>>;
  userScopes?: Partial<Record<Scope, number>>;
  anonymousScopes?: Partial<Record<Scope, number>>;
};

function resolvePolicy(options: LimitOptions) {
  const policy = {
    windowMs: options.windowMs ?? REQUEST_LIMIT_POLICY.windowMs,
    ipLimit: options.ipLimit ?? REQUEST_LIMIT_POLICY.ipLimit,
    ipScopes: { ...REQUEST_LIMIT_POLICY.ipScopes, ...options.ipScopes },
    userScopes: { ...REQUEST_LIMIT_POLICY.userScopes, ...options.userScopes },
    anonymousScopes: { ...REQUEST_LIMIT_POLICY.anonymousScopes, ...options.anonymousScopes },
  };
  // Auch zukünftige Konfigurationsänderungen dürfen keinen unbegrenzten oder ungültigen Wert einschleusen.
  const values = [policy.windowMs, policy.ipLimit, ...Object.values(policy.ipScopes),
    ...Object.values(policy.userScopes), ...Object.values(policy.anonymousScopes)];
  if (values.some(value => !Number.isSafeInteger(value) || value <= 0) || policy.windowMs > 2_147_483_647) {
    throw new Error("Rate-limit budgets and windowMs must be positive finite integers");
  }
  return policy;
}

function requestScope(req: Request): Scope {
  // req.path enthält innerhalb des /api-Mounts keine Query-Parameter.
  if (/^\/auth(?:-v2)?(?:\/|$)/i.test(req.path)) return "auth";
  if (req.method === "POST" && (
    /^\/(?:quotes|invoices)\/[^/]+\/send-email\/?$/i.test(req.path) ||
    /^\/inventory-items\/bulk-generate\/?$/i.test(req.path)
  )) return "expensive";
  return req.method === "GET" || req.method === "HEAD" ? "read" : "write";
}

function createLimiter(scope: Scope | "all", layer: "ip" | "account", options: {
  windowMs: number;
  limit: Options["limit"];
  keyGenerator?: Options["keyGenerator"];
  identity?: (req: Request) => string | null;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    ...(options.keyGenerator ? { keyGenerator: options.keyGenerator } : {}),
    skip: req => scope !== "all" && requestScope(req) !== scope,
    // Mehrere Schutzschichten werden als getrennte Policies ausgegeben statt gegenseitig überschrieben.
    standardHeaders: "draft-8",
    identifier: `nexus-${layer}-${scope}`,
    legacyHeaders: true,
    handler: (req, res) => {
      res.setHeader("X-RateLimit-Source", "nexus-events-api");
      res.status(429).json({
        error: "Too many requests, please try again later.",
        code: "RATE_LIMITED",
        scope,
        layer: layer === "ip" ? "ip" : options.identity?.(req) ? "user" : "anonymous",
      });
    },
  });
}

export function configureRequestLimits(app: Express, options: LimitOptions = {}) {
  // Nur die konfigurierte Anzahl rechter Proxy-Hops vertrauen, niemals pauschal allen.
  app.set("trust proxy", getTrustedProxyHops(String(options.proxyHops ?? getTrustedProxyHops())));
  const policy = resolvePolicy(options);
  // Vor Clerk bleiben alle Requests und ungültigen Token pro IP bzw. IPv6-Subnetz begrenzt.
  app.use("/api", createLimiter("all", "ip", { windowMs: policy.windowMs, limit: policy.ipLimit }));
  for (const scope of scopes) {
    app.use("/api", createLimiter(scope, "ip", { windowMs: policy.windowMs, limit: policy.ipScopes[scope] }));
  }
}

export function configureAccountLimits(app: Express, options: LimitOptions = {}) {
  const policy = resolvePolicy(options);
  const identities = new WeakMap<Request, string | null>();
  const identity = (req: Request) => identities.get(req) ?? null;
  app.use("/api", async (req, _res, next) => {
    try {
      if (getAuthMode() === "auth-v2") {
        const resolved = await resolveAuthenticatedUser(req);
        identities.set(req, resolved ? `auth-v2:${resolved.appUser.id}` : null);
      } else {
        // Clerk bleibt ausschließlich im ausdrücklich gewählten Rückfallmodus aktiv.
        const { getAuth } = await import("@clerk/express");
        const auth = getAuth(req, { acceptsToken: "session_token" });
        identities.set(req, auth.isAuthenticated && auth.userId ? `clerk:${auth.userId}` : null);
      }
      next();
    } catch (error) { next(error); }
  });
  for (const scope of scopes) {
    app.use("/api", createLimiter(scope, "account", {
      windowMs: policy.windowMs,
      identity,
      limit: req => identity(req) ? policy.userScopes[scope] : policy.anonymousScopes[scope],
      keyGenerator: req => {
        const userId = identity(req);
        // Anonyme Anfragen behalten einen eigenen IPv6-sicheren IP-Schlüssel.
        return userId ? `user:${userId}` : `anonymous:${ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? "unknown")}`;
      },
    }));
  }
  // /health liegt weiterhin außerhalb aller /api-Mounts und verbraucht kein Benutzerbudget.
}
