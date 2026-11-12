import { getAuthMode } from "../../auth/mode.js";
import type { Algorithm } from "@node-rs/argon2";

// Auth-V2 ist der Primärmodus; Clerk ist ein ausdrücklich gewählter Rückfallmodus.
export const AUTH_V2_BASE_PATH = "/api/auth-v2";

export const SESSION_ABSOLUTE_MS = 8 * 60 * 60 * 1000;
export const SESSION_IDLE_SECONDS = 30 * 60;
export const REAUTH_MAX_AGE_MS = 5 * 60 * 1000;
export const MFA_ENFORCEMENT_GRACE_MS = 7 * 24 * 60 * 60 * 1000;
export const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;
export const RESET_TOKEN_TTL_SECONDS = 60 * 60;

/**
 * OWASP minimum for Argon2id: 19 MiB memory, 2 iterations, 1 lane.
 * Production sizing still needs a benchmark on the target Render instance.
 */
export const ARGON2_OPTIONS = {
  // Algorithm.Argon2id. A numeric literal is required because TypeScript
  // const enums cannot be referenced when `isolatedModules` is enabled.
  algorithm: 2 as Algorithm,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export type AuthV2RuntimeConfig = {
  enabled: boolean;
  baseURL: string;
  /** Public application origin used for browser-facing auth links (invitations, reset password). */
  appURL: string;
  basePath: string;
  secret: string;
  trustedOrigins: string[];
  secureCookies: boolean;
  absoluteMs: number;
  idleSeconds: number;
  updateAgeSeconds: number;
  reauthMaxAgeMs: number;
  mfaEnforcementGraceMs: number;
  resetTokenTtlSeconds: number;
  invitationTtlMs: number;
  exposeInvitationToken: boolean;
  emailDeliveryEnabled: boolean;
  loginRateLimit: {
    windowMs: number;
    maxFailures: number;
    blockMs: number;
    maxFailuresPerIp: number;
  };
};

type Env = Record<string, string | undefined>;

function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
  name: string,
): number {
  if (raw === undefined || raw === "") return fallback;
  if (!/^[1-9]\d*$/.test(raw)) {
    throw new Error(`${name} must be a positive integer`);
  }
  return Number(raw);
}

function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw === "") return fallback;
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new Error(`Expected "true" or "false", received "${raw}"`);
}

export function readAuthV2Config(env: Env = process.env): AuthV2RuntimeConfig {
  const baseURL = env["AUTH_V2_BASE_URL"] ?? "http://127.0.0.1:3210";
  const appURL = env["AUTH_V2_APP_URL"] ?? baseURL;
  const secret = env["AUTH_V2_AUTH_SECRET"] ?? "";

  if (secret.length < 32) {
    throw new Error(
      "AUTH_V2_AUTH_SECRET must be set to at least 32 characters before auth-v2 can start",
    );
  }

  const configuredOrigins = (env["AUTH_V2_TRUSTED_ORIGINS"] ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const idleSeconds = parsePositiveInt(
    env["AUTH_V2_SESSION_IDLE_SECONDS"],
    SESSION_IDLE_SECONDS,
    "AUTH_V2_SESSION_IDLE_SECONDS",
  );

  return {
    enabled: getAuthMode(env) === "auth-v2",
    baseURL,
    appURL,
    basePath: AUTH_V2_BASE_PATH,
    secret,
    trustedOrigins:
      configuredOrigins.length > 0 ? configuredOrigins : [baseURL],
    secureCookies: parseBoolean(
      env["AUTH_V2_SECURE_COOKIES"],
      baseURL.startsWith("https://"),
    ),
    absoluteMs: parsePositiveInt(
      env["AUTH_V2_SESSION_ABSOLUTE_MS"],
      SESSION_ABSOLUTE_MS,
      "AUTH_V2_SESSION_ABSOLUTE_MS",
    ),
    idleSeconds,
    updateAgeSeconds: Math.min(5 * 60, Math.floor(idleSeconds / 2)),
    reauthMaxAgeMs: parsePositiveInt(
      env["AUTH_V2_REAUTH_MAX_AGE_MS"],
      REAUTH_MAX_AGE_MS,
      "AUTH_V2_REAUTH_MAX_AGE_MS",
    ),
    mfaEnforcementGraceMs: parsePositiveInt(
      env["AUTH_V2_MFA_GRACE_MS"],
      MFA_ENFORCEMENT_GRACE_MS,
      "AUTH_V2_MFA_GRACE_MS",
    ),
    resetTokenTtlSeconds: parsePositiveInt(
      env["AUTH_V2_RESET_TOKEN_TTL_SECONDS"],
      RESET_TOKEN_TTL_SECONDS,
      "AUTH_V2_RESET_TOKEN_TTL_SECONDS",
    ),
    invitationTtlMs: parsePositiveInt(
      env["AUTH_V2_INVITATION_TTL_MS"],
      INVITATION_TTL_MS,
      "AUTH_V2_INVITATION_TTL_MS",
    ),
    exposeInvitationToken: parseBoolean(
      env["AUTH_V2_EXPOSE_INVITATION_TOKEN"],
      false,
    ),
    emailDeliveryEnabled: parseBoolean(
      env["AUTH_V2_EMAIL_DELIVERY_ENABLED"],
      false,
    ),
    loginRateLimit: {
      windowMs: parsePositiveInt(
        env["AUTH_V2_LOGIN_WINDOW_MS"],
        60_000,
        "AUTH_V2_LOGIN_WINDOW_MS",
      ),
      maxFailures: parsePositiveInt(
        env["AUTH_V2_LOGIN_MAX_FAILURES"],
        5,
        "AUTH_V2_LOGIN_MAX_FAILURES",
      ),
      blockMs: parsePositiveInt(
        env["AUTH_V2_LOGIN_BLOCK_MS"],
        15 * 60_000,
        "AUTH_V2_LOGIN_BLOCK_MS",
      ),
      maxFailuresPerIp: parsePositiveInt(
        env["AUTH_V2_LOGIN_MAX_FAILURES_PER_IP"],
        50,
        "AUTH_V2_LOGIN_MAX_FAILURES_PER_IP",
      ),
    },
  };
}

export function assertAuthV2Enabled(config: AuthV2RuntimeConfig): void {
  if (!config.enabled) {
    throw new Error(
      "Auth-v2 is disabled by explicit Clerk fallback configuration. Select AUTH_MODE=auth-v2 with its required configuration.",
    );
  }
}
