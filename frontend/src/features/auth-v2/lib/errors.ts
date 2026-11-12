import { AuthV2ApiError } from "../api/client";

/**
 * Server error codes mapped to translation keys. Unknown codes fall back to the
 * generic message; the raw code is offered separately for support without ever
 * exposing request bodies or credentials.
 */
const ERROR_KEY_BY_CODE: Record<string, string> = {
  NETWORK_ERROR: "network",
  AUTH_ERROR: "generic",
  INTERNAL_SERVER_ERROR: "server",
  AUTH_RESPONSE_SANITIZATION_FAILED: "server",
  UNAUTHENTICATED: "unauthenticated",
  ABSOLUTE_EXPIRED: "absoluteExpired",
  IDLE_EXPIRED: "idleExpired",
  ACCOUNT_INACTIVE: "accountInactive",
  MFA_ENROLLMENT_REQUIRED: "mfaEnrollmentRequired",
  REAUTH_REQUIRED: "reauthRequired",
  INSUFFICIENT_PERMISSIONS: "insufficientPermissions",
  INVALID_ORIGIN: "invalidOrigin",
  RATE_LIMITED: "rateLimited",
  INVALID_CREDENTIALS: "invalidCredentials",
  INVALID_REQUEST: "invalidRequest",
  PASSWORD_REQUIRED: "passwordRequired",
  INVALID_INVITATION: "invalidInvitation",
  INVITATION_REVOKED: "invitationRevoked",
  INVITATION_ALREADY_USED: "invitationAlreadyUsed",
  INVITATION_EXPIRED: "invitationExpired",
  EMAIL_IN_USE: "emailInUse",
  INVITATION_ALREADY_PENDING: "invitationAlreadyPending",
  INVITATION_NOT_FOUND: "invitationNotFound",
  INVALID_EMAIL: "invalidEmail",
  INVALID_ROLE: "invalidRole",
  WEAK_PASSWORD: "weakPassword",
  INVALID_ACTIVE_FLAG: "invalidActiveFlag",
  NO_CHANGES: "noChanges",
  SELF_MODIFICATION_FORBIDDEN: "selfModificationForbidden",
  LAST_OWNER_PROTECTION: "lastOwnerProtection",
  TARGET_INACTIVE: "targetInactive",
  TARGET_REQUIRED: "targetRequired",
  USER_NOT_FOUND: "userNotFound",
  SESSION_NOT_FOUND: "sessionNotFound",
  INVALID_TOKEN: "invalidToken",
  PASSWORD_TOO_SHORT: "passwordTooShort",
  PASSWORD_TOO_LONG: "passwordTooLong",
  INVALID_PASSWORD: "invalidPassword",
  INVALID_CODE: "invalidCode",
  INVALID_TWO_FACTOR_CODE: "invalidCode",
  TOO_MANY_ATTEMPTS: "twoFactorLocked",
  TWO_FACTOR_LOCKED: "twoFactorLocked",
};

export function isAuthV2ApiError(error: unknown): error is AuthV2ApiError {
  return error instanceof AuthV2ApiError;
}

export function errorMessageKey(error: unknown): string {
  if (error instanceof AuthV2ApiError) {
    const key = ERROR_KEY_BY_CODE[error.code];
    if (key) return `authV2.errors.${key}`;
  }
  return "authV2.errors.generic";
}

/** Safe support detail: an error code, never a message, body or credential. */
export function errorSupportCode(error: unknown): string | null {
  if (error instanceof AuthV2ApiError) return error.code;
  return null;
}

export function retryAfterSeconds(error: unknown): number | null {
  if (error instanceof AuthV2ApiError) return error.retryAfterSeconds;
  return null;
}

export function isRateLimited(error: unknown): boolean {
  return error instanceof AuthV2ApiError && error.isRateLimited;
}

export function isReauthRequired(error: unknown): boolean {
  return error instanceof AuthV2ApiError && error.isReauthRequired;
}

export function isMfaEnrollmentRequired(error: unknown): boolean {
  return error instanceof AuthV2ApiError && error.isMfaEnrollmentRequired;
}

export function isOriginRejected(error: unknown): boolean {
  return error instanceof AuthV2ApiError && error.isOriginRejected;
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof AuthV2ApiError && error.code === "NETWORK_ERROR";
}
