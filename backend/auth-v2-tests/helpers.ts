import express from "express";
import request, { type Response as SupertestResponse } from "supertest";
import { hash } from "@node-rs/argon2";
import { createOTP } from "@better-auth/utils/otp";
import { base32 } from "@better-auth/utils/base32";
import type { Express } from "express";
import { createAuthV2 } from "../src/modules/auth-v2/auth.js";
import {
  ARGON2_OPTIONS,
  readAuthV2Config,
  type AuthV2RuntimeConfig,
} from "../src/modules/auth-v2/config.js";
import { authV2Prisma } from "../src/modules/auth-v2/prisma.js";
import {
  createAuthV2Router,
  type AuthV2RouterOptions,
} from "../src/modules/auth-v2/router.js";
import type { Role } from "../src/modules/auth-v2/permissions.js";

export const BASE_PATH = "/api/auth-v2";
export const ORIGIN = "http://127.0.0.1:3210";
export const PASSWORD = "Correct-Horse-Battery-2026";
export const NEW_PASSWORD = "Rotated-Horse-Battery-2026";

export const OWNER_ID = "11111111-1111-4111-8111-111111111111";
export const OWNER2_ID = "22222222-2222-4222-8222-222222222222";
export const ADMIN_ID = "33333333-3333-4333-8333-333333333333";
export const EMPLOYEE_ID = "44444444-4444-4444-8444-444444444444";
export const MANAGER_ID = "55555555-5555-4555-8555-555555555555";

export type TestApp = {
  app: Express;
  auth: ReturnType<typeof createAuthV2>;
  config: AuthV2RuntimeConfig;
};

export function buildApp(options: {
  config?: Partial<AuthV2RuntimeConfig>;
  router?: Pick<AuthV2RouterOptions, "loginLimiter" | "invitationLimiter">;
} = {}): TestApp {
  const config: AuthV2RuntimeConfig = {
    ...readAuthV2Config(),
    ...options.config,
  };
  const auth = createAuthV2(config);
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    BASE_PATH,
    createAuthV2Router({ auth, config, ...options.router }),
  );
  return { app, auth, config };
}

export async function resetDb(): Promise<void> {
  await authV2Prisma.securityEvent.deleteMany();
  await authV2Prisma.verification.deleteMany();
  await authV2Prisma.session.deleteMany();
  await authV2Prisma.account.deleteMany();
  await authV2Prisma.twoFactor.deleteMany();
  await authV2Prisma.invitation.deleteMany();
  await authV2Prisma.appUser.deleteMany();
}

export type SeedInput = {
  id: string;
  email: string;
  name?: string;
  role?: Role;
  isActive?: boolean;
  clerkUserId?: string | null;
  password?: string;
  emailVerified?: boolean;
};

export async function seedUser(input: SeedInput) {
  const passwordHash = await hash(input.password ?? PASSWORD, ARGON2_OPTIONS);
  return authV2Prisma.appUser.create({
    data: {
      id: input.id,
      email: input.email,
      name: input.name ?? input.email.split("@")[0],
      emailVerified: input.emailVerified ?? true,
      role: input.role ?? "EMPLOYEE",
      isActive: input.isActive ?? true,
      clerkUserId: input.clerkUserId ?? null,
      accounts: {
        create: {
          providerId: "credential",
          accountId: input.id,
          password: passwordHash,
        },
      },
    },
  });
}

export function setCookieLines(res: SupertestResponse): string[] {
  const raw = (res.headers as Record<string, unknown>)["set-cookie"];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") return [raw];
  return [];
}

export function findSessionCookieLine(res: SupertestResponse): string {
  const line = setCookieLines(res).find((cookie) =>
    /(?:^|\s)(?:__Secure-)?nexus\.session_token=/.test(cookie),
  );
  if (!line) {
    throw new Error(`No session cookie found: ${JSON.stringify(setCookieLines(res))}`);
  }
  return line;
}

export function extractCookie(res: SupertestResponse): string {
  return findSessionCookieLine(res).split(";")[0] ?? "";
}

/** Joins every cookie set by a response (used for the MFA challenge cookie). */
export function cookieHeader(res: SupertestResponse): string {
  return setCookieLines(res)
    .map((line) => line.split(";")[0])
    .filter((value): value is string => typeof value === "string")
    .join("; ");
}

export function rawSessionToken(res: SupertestResponse): string {
  const value = extractCookie(res).split("=").slice(1).join("=");
  return value.split(".")[0] ?? "";
}

export async function sessionIdForCookie(cookie: string): Promise<string> {
  const value = cookie.split("=").slice(1).join("=");
  const raw = value.split(".")[0] ?? "";
  const { hashSessionToken } = await import("../src/modules/auth-v2/token-hash.js");
  const row = await authV2Prisma.session.findUnique({
    where: { token: hashSessionToken(raw) },
    select: { id: true },
  });
  if (!row) throw new Error("Session not found for cookie");
  return row.id;
}

export type LoginResult = {
  res: SupertestResponse;
  cookie?: string;
  token?: string;
  mfaRedirect: boolean;
};

export async function login(
  app: Express,
  email: string,
  password = PASSWORD,
  origin = ORIGIN,
): Promise<LoginResult> {
  const res = await request(app)
    .post(`${BASE_PATH}/sign-in/email`)
    .set("Origin", origin)
    .send({ email, password });

  const hasSession = res.status === 200 && setCookieLines(res).some((line) =>
    /(?:^|\s)(?:__Secure-)?nexus\.session_token=[^;\s]/.test(line),
  );

  const result: LoginResult = {
    res,
    mfaRedirect: Boolean(
      res.body && (res.body as { twoFactorRedirect?: boolean }).twoFactorRedirect,
    ),
  };
  if (hasSession) {
    result.cookie = extractCookie(res);
    result.token = rawSessionToken(res);
  }
  return result;
}

export async function getSession(app: Express, cookie: string) {
  return request(app).get(`${BASE_PATH}/get-session`).set("Cookie", cookie);
}

export async function listSessions(app: Express, cookie: string) {
  return request(app)
    .get(`${BASE_PATH}/list-sessions`)
    .set("Cookie", cookie)
    .set("Origin", ORIGIN);
}

export async function stepUp(
  app: Express,
  cookie: string,
  password = PASSWORD,
) {
  return request(app)
    .post(`${BASE_PATH}/account/step-up`)
    .set("Origin", ORIGIN)
    .set("Cookie", cookie)
    .send({ password });
}

export function totpForUri(uri: string) {
  const parsed = new URL(uri);
  const encodedSecret = parsed.searchParams.get("secret");
  if (!encodedSecret) throw new Error("TOTP URI has no secret");
  const rawSecret = new TextDecoder().decode(base32.decode(encodedSecret));
  return createOTP(rawSecret, { digits: 6, period: 30 });
}

export async function currentTotp(uri: string): Promise<string> {
  return totpForUri(uri).totp();
}
