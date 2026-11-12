export type ValidationCode =
  | "required"
  | "emailInvalid"
  | "passwordTooShort"
  | "passwordTooLong"
  | "passwordMismatch"
  | "nameTooLong"
  | "codeInvalid"
  | "tokenMissing";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const TOTP_LENGTH = 6;
export const NAME_MAX_LENGTH = 120;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): ValidationCode | null {
  const email = value.trim();
  if (email.length === 0) return "required";
  if (email.length > 320 || !EMAIL_PATTERN.test(email)) return "emailInvalid";
  return null;
}

/** Login only checks presence; the backend owns credential validation. */
export function validateLoginPassword(value: string): ValidationCode | null {
  return value.length === 0 ? "required" : null;
}

export function validateNewPassword(value: string): ValidationCode | null {
  if (value.length === 0) return "required";
  if (value.length < PASSWORD_MIN_LENGTH) return "passwordTooShort";
  if (value.length > PASSWORD_MAX_LENGTH) return "passwordTooLong";
  return null;
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): ValidationCode | null {
  if (confirmation.length === 0) return "required";
  if (password !== confirmation) return "passwordMismatch";
  return null;
}

export function validateOptionalName(value: string): ValidationCode | null {
  return value.trim().length > NAME_MAX_LENGTH ? "nameTooLong" : null;
}

export function normalizeOtp(value: string): string {
  return value.replace(/\D/g, "").slice(0, TOTP_LENGTH);
}

export function validateOtp(value: string): ValidationCode | null {
  return normalizeOtp(value).length === TOTP_LENGTH ? null : "codeInvalid";
}

/**
 * better-auth backup codes are five alphanumeric characters, a hyphen and five
 * more characters. Verification is an exact string comparison, so the helper
 * only trims surrounding whitespace and never changes case or hyphens.
 */
export function normalizeRecoveryCode(value: string): string {
  return value.trim();
}

export function validateRecoveryCode(value: string): ValidationCode | null {
  return normalizeRecoveryCode(value).length === 0 ? "required" : null;
}

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  key: "weak" | "fair" | "good" | "strong" | "veryStrong";
};

/**
 * Advisory only. The backend enforces length (12-128) and nothing stronger, so
 * the meter never blocks submission of a backend-valid password.
 */
export function getPasswordStrength(value: string): PasswordStrength {
  if (value.length === 0) return { score: 0, key: "weak" };

  let points = 0;
  if (value.length >= PASSWORD_MIN_LENGTH) points += 1;
  if (value.length >= 16) points += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) points += 1;
  if (/\d/.test(value) && /[^\w\s]/.test(value)) points += 1;

  if (points <= 0) return { score: 1, key: "weak" };
  if (points === 1) return { score: 2, key: "fair" };
  if (points === 2) return { score: 3, key: "good" };
  if (points === 3) return { score: 4, key: "strong" };
  return { score: 4, key: "veryStrong" };
}

export function extractTotpSecret(uri: string): string | null {
  try {
    const parsed = new URL(uri);
    if (parsed.protocol !== "otpauth:") return null;
    const secret = parsed.searchParams.get("secret");
    if (!secret || !/^[A-Z2-7]+=*$/i.test(secret)) return null;
    return secret.toUpperCase();
  } catch {
    return null;
  }
}

export function formatTotpSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Prevents open redirects after login. Only same-origin absolute paths are
 * accepted; protocol-relative and absolute URLs fall back.
 */
export function safeReturnTo(
  candidate: string | null | undefined,
  fallback: string,
): string {
  if (!candidate) return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  if (candidate.includes("\\")) return fallback;
  return candidate;
}
