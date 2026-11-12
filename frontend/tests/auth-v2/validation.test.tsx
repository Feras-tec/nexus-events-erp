import { describe, expect, it } from "vitest";

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  extractTotpSecret,
  formatTotpSecret,
  getPasswordStrength,
  normalizeOtp,
  normalizeRecoveryCode,
  safeReturnTo,
  validateEmail,
  validateLoginPassword,
  validateNewPassword,
  validateOtp,
  validatePasswordConfirmation,
  validateRecoveryCode,
} from "../../src/features/auth-v2/lib/validation";
import {
  REAUTH_WINDOW_MS,
  isExpired,
  isRecentAuthentication,
  parseUserAgent,
} from "../../src/features/auth-v2/lib/format";

describe("Auth V2 Formularvalidierung", () => {
  it("prüft E-Mail-Adressen ohne den Server zu ersetzen", () => {
    expect(validateEmail("")).toBe("required");
    expect(validateEmail("keine-mail")).toBe("emailInvalid");
    expect(validateEmail("a@b")).toBe("emailInvalid");
    expect(validateEmail("  name@firma.de  ")).toBeNull();
    expect(validateEmail(`${"a".repeat(320)}@x.de`)).toBe("emailInvalid");
  });

  it("verlangt beim Login nur ein nicht leeres Passwort", () => {
    expect(validateLoginPassword("")).toBe("required");
    expect(validateLoginPassword("x")).toBeNull();
  });

  it("spiegelt die Backend-Passwortrichtlinie 12–128", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(12);
    expect(PASSWORD_MAX_LENGTH).toBe(128);
    expect(validateNewPassword("")).toBe("required");
    expect(validateNewPassword("kurz")).toBe("passwordTooShort");
    expect(validateNewPassword("a".repeat(12))).toBeNull();
    expect(validateNewPassword("a".repeat(128))).toBeNull();
    expect(validateNewPassword("a".repeat(129))).toBe("passwordTooLong");
  });

  it("prüft die Passwortbestätigung", () => {
    expect(validatePasswordConfirmation("abcdefghijkl", "")).toBe("required");
    expect(validatePasswordConfirmation("abcdefghijkl", "abcdefghijkm")).toBe(
      "passwordMismatch",
    );
    expect(validatePasswordConfirmation("abcdefghijkl", "abcdefghijkl")).toBeNull();
  });

  it("filtert TOTP-Eingaben auf sechs Ziffern", () => {
    expect(normalizeOtp("12 34-56")).toBe("123456");
    expect(normalizeOtp("1234567")).toBe("123456");
    expect(validateOtp("12345")).toBe("codeInvalid");
    expect(validateOtp("123456")).toBeNull();
  });

  it("verändert Wiederherstellungscodes nicht (exakter Vergleich)", () => {
    expect(normalizeRecoveryCode("  ab12C-dE34f  ")).toBe("ab12C-dE34f");
    expect(validateRecoveryCode("   ")).toBe("required");
    expect(validateRecoveryCode("abcde-12345")).toBeNull();
  });

  it("bewertet Passwortstärke nur beratend", () => {
    expect(getPasswordStrength("").key).toBe("weak");
    expect(getPasswordStrength("abcdefghijkl").score).toBeGreaterThan(0);
    expect(getPasswordStrength("Abcdefghijk1234!").key).toBe("veryStrong");
  });

  it("extrahiert TOTP-Geheimnisse ausschließlich aus otpauth-URIs", () => {
    const uri = "otpauth://totp/Nexus:owner@nexus.test?secret=JBSWY3DPEHPK3PXP&issuer=Nexus";
    expect(extractTotpSecret(uri)).toBe("JBSWY3DPEHPK3PXP");
    expect(formatTotpSecret("JBSWY3DPEHPK3PXP")).toBe("JBSW Y3DP EHPK 3PXP");
    expect(extractTotpSecret("https://example.com?secret=ABC")).toBeNull();
    expect(extractTotpSecret("otpauth://totp/x")).toBeNull();
  });

  it("verhindert Open Redirects über returnTo", () => {
    expect(safeReturnTo("/auth-v2/account/security", "/fallback")).toBe(
      "/auth-v2/account/security",
    );
    expect(safeReturnTo("//evil.test", "/fallback")).toBe("/fallback");
    expect(safeReturnTo("https://evil.test", "/fallback")).toBe("/fallback");
    expect(safeReturnTo("\\\\evil.test", "/fallback")).toBe("/fallback");
    expect(safeReturnTo(null, "/fallback")).toBe("/fallback");
  });
});

describe("Auth V2 Formatierung und Sitzungsmetadaten", () => {
  it("erkennt kürzlich bestätigte Sitzungen", () => {
    const now = Date.parse("2026-11-05T12:00:00Z");
    expect(isRecentAuthentication(null, now)).toBe(false);
    expect(
      isRecentAuthentication(new Date(now - 60_000).toISOString(), now),
    ).toBe(true);
    expect(
      isRecentAuthentication(
        new Date(now - REAUTH_WINDOW_MS - 1_000).toISOString(),
        now,
      ),
    ).toBe(false);
  });

  it("erkennt abgelaufene Zeitpunkte", () => {
    const now = Date.parse("2026-11-05T12:00:00Z");
    expect(isExpired(new Date(now + 1_000).toISOString(), now)).toBe(false);
    expect(isExpired(new Date(now - 1_000).toISOString(), now)).toBe(true);
    expect(isExpired(null, now)).toBe(false);
  });

  it("liest Geräteinformationen ohne externe Dienste", () => {
    expect(
      parseUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
      ),
    ).toEqual({ browser: "Safari", os: "iOS", mobile: true });

    expect(
      parseUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36",
      ),
    ).toEqual({ browser: "Chrome", os: "Windows", mobile: false });

    expect(parseUserAgent(null)).toEqual({
      browser: null,
      os: null,
      mobile: false,
    });
  });
});
