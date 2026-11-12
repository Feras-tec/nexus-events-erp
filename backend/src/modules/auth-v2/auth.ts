import { hash, verify } from "@node-rs/argon2";
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { createHashingPrismaAdapter } from "./adapter.js";
import {
  ARGON2_OPTIONS,
  assertAuthV2Enabled,
  type AuthV2RuntimeConfig,
} from "./config.js";
import { deliverPasswordResetEmail } from "./email.js";
import { authV2Prisma, getAuthV2Prisma } from "./prisma.js";
import { logSecurityEvent } from "./security.js";

export function createAuthV2(config: AuthV2RuntimeConfig) {
  assertAuthV2Enabled(config);

  return betterAuth({
    appName: "Nexus Events ERP",
    secret: config.secret,
    baseURL: config.baseURL,
    basePath: config.basePath,
    // Bei aktivierter Auth-V2-Konfiguration weiterhin früh und ohne URL-Fallback prüfen.
    database: createHashingPrismaAdapter(getAuthV2Prisma()),
    trustedOrigins: config.trustedOrigins,
    emailAndPassword: {
      enabled: true,
      // Invitation-only onboarding. Public self-registration stays disabled.
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: config.resetTokenTtlSeconds,
      revokeSessionsOnPasswordReset: true,
      password: {
        hash: (password: string) => hash(password, ARGON2_OPTIONS),
        verify: ({
          hash: storedHash,
          password,
        }: {
          hash: string;
          password: string;
        }) => verify(storedHash, password, ARGON2_OPTIONS),
      },
      sendResetPassword: async ({
        user,
        url,
        token,
      }: {
        user: { id: string; email: string };
        url: string;
        token: string;
      }) => {
        await deliverPasswordResetEmail({
          userId: user.id,
          email: user.email,
          token,
          url,
          createdAt: new Date(),
        });
      },
      onPasswordReset: async ({ user }: { user: { id: string } }) => {
        await authV2Prisma.session.deleteMany({ where: { userId: user.id } });
        await logSecurityEvent({
          eventType: "PASSWORD_RESET_COMPLETED",
          actorId: user.id,
        });
      },
    },
    user: {
      // ADR-001: the existing AppUser row is the better-auth user model.
      modelName: "appUser",
      additionalFields: {
        role: { type: "string", required: false, input: false },
        isActive: { type: "boolean", required: false, input: false },
        twoFactorRequired: {
          type: "boolean",
          required: false,
          input: false,
        },
        twoFactorEnforcedAt: {
          type: "date",
          required: false,
          input: false,
        },
      },
    },
    session: {
      expiresIn: config.idleSeconds,
      updateAge: config.updateAgeSeconds,
      storeSessionInDatabase: true,
      cookieCache: { enabled: false },
      additionalFields: {
        reauthenticatedAt: { type: "date", required: false, returned: false },
        lastSeenAt: { type: "date", required: false, returned: false },
      },
    },
    verification: {
      // Password-reset and two-factor verification identifiers are stored hashed.
      storeIdentifier: "hashed",
    },
    advanced: {
      useSecureCookies: config.secureCookies,
      cookiePrefix: "nexus",
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      },
    },
    // Login throttling is implemented by the auth-v2 router so it can be
    // tested deterministically and replaced with a shared store later.
    rateLimit: { enabled: false },
    plugins: [
      twoFactor({
        issuer: "Nexus Events ERP",
        totpOptions: { digits: 6, period: 30 },
        backupCodeOptions: {
          amount: 10,
          length: 10,
          storeBackupCodes: "encrypted",
        },
        accountLockout: {
          enabled: true,
          maxFailedAttempts: 5,
          durationSeconds: 15 * 60,
        },
        trustDeviceMaxAge: 30 * 24 * 60 * 60,
      }),
    ],
    databaseHooks: {
      session: {
        create: {
          before: async (session: {
            userId: string;
            createdAt?: Date;
            expiresAt?: Date;
          }) => {
            const user = await authV2Prisma.appUser.findUnique({
              where: { id: session.userId },
              select: {
                isActive: true,
                twoFactorEnabled: true,
                twoFactorRequired: true,
                twoFactorEnforcedAt: true,
              },
            });
            if (!user || !user.isActive) return false;

            const now = Date.now();
            const enforcementOverdue =
              user.twoFactorRequired &&
              !user.twoFactorEnabled &&
              (!user.twoFactorEnforcedAt ||
                now - user.twoFactorEnforcedAt.getTime() >
                  config.mfaEnforcementGraceMs);

            if (enforcementOverdue) {
              await logSecurityEvent({
                eventType: "LOGIN_BLOCKED_MFA_REQUIRED",
                targetId: session.userId,
              });
              return false;
            }

            const createdAt = session.createdAt ?? new Date();
            const absoluteAt = new Date(createdAt.getTime() + config.absoluteMs);
            const expiresAt =
              session.expiresAt && session.expiresAt < absoluteAt
                ? session.expiresAt
                : absoluteAt;

            return {
              data: {
                ...session,
                expiresAt,
                lastSeenAt: createdAt,
              },
            };
          },
        },
      },
    },
  });
}

export type AuthV2Auth = ReturnType<typeof createAuthV2>;
