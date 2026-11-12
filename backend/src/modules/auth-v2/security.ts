import type { Request } from "express";
import { authV2Prisma } from "./prisma.js";

const SENSITIVE_KEY = /token|password|secret|cookie|authorization|hash/i;

/** Recursively drops credential-like keys before persisting audit metadata. */
export function sanitizeMetadata(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[TRUNCATED]";
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeMetadata(entry, depth + 1));
  }
  if (!value || typeof value !== "object") return value;

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(key)) continue;
    result[key] = sanitizeMetadata(entry, depth + 1);
  }
  return result;
}

export type SecurityEventInput = {
  eventType: string;
  actorId?: string | null;
  targetId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function logSecurityEvent(input: SecurityEventInput): Promise<void> {
  await authV2Prisma.securityEvent.create({
    data: {
      eventType: input.eventType,
      actorId: input.actorId ?? null,
      targetId: input.targetId ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      metadata: input.metadata
        ? (sanitizeMetadata(input.metadata) as object)
        : undefined,
    },
  });
}

export function clientMeta(req: Request) {
  return {
    ip: req.ip ?? req.socket.remoteAddress ?? null,
    userAgent: req.get("user-agent") ?? null,
  };
}

type Bucket = {
  failures: number;
  windowStart: number;
  blockedUntil: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  retryAfterMs: number;
};

/**
 * In-memory login limiter keyed by `ip|normalizedEmail` (or `ip` for the
 * global budget).
 *
 * Production must replace this with a shared Redis-backed store so multiple
 * Render instances share state. The policy and tests are identical.
 */
export class LoginRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    readonly options: {
      windowMs?: number;
      maxFailures?: number;
      blockMs?: number;
    } = {},
  ) {}

  private get windowMs(): number {
    return this.options.windowMs ?? 60_000;
  }

  private get maxFailures(): number {
    return this.options.maxFailures ?? 5;
  }

  private get blockMs(): number {
    return this.options.blockMs ?? 15 * 60_000;
  }

  check(key: string, now = Date.now()): RateLimitDecision {
    const bucket = this.buckets.get(key);
    if (!bucket) return { allowed: true, retryAfterMs: 0 };

    if (bucket.blockedUntil > now) {
      return { allowed: false, retryAfterMs: bucket.blockedUntil - now };
    }
    if (now - bucket.windowStart > this.windowMs) {
      this.buckets.delete(key);
      return { allowed: true, retryAfterMs: 0 };
    }
    return { allowed: true, retryAfterMs: 0 };
  }

  fail(key: string, now = Date.now()): void {
    const bucket = this.buckets.get(key);
    if (!bucket || now - bucket.windowStart > this.windowMs) {
      this.buckets.set(key, {
        failures: 1,
        windowStart: now,
        blockedUntil: 0,
      });
      return;
    }

    bucket.failures += 1;
    if (bucket.failures >= this.maxFailures) {
      bucket.blockedUntil = now + this.blockMs;
    }
  }

  success(key: string): void {
    this.buckets.delete(key);
  }

  clear(): void {
    this.buckets.clear();
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
