import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Copy,
  KeyRound,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import { Button } from "../../../components/atoms/Button";
import { Checkbox } from "../../../components/atoms/Checkbox";
import { authV2Api } from "../api";
import { authV2QueryKeys } from "../api/queryKeys";
import { AuthCard } from "../components/AuthCard";
import { AuthHeading } from "../components/AuthHeading";
import { AuthShell } from "../components/AuthShell";
import { FormAlert } from "../components/FormAlert";
import { OtpInput } from "../components/OtpInput";
import { PasswordField } from "../components/PasswordField";
import { QrCode } from "../components/QrCode";
import { RecoveryCodeList } from "../components/RecoveryCodeList";
import { useAuthV2 } from "../context/AuthV2Provider";
import { AuthV2Link } from "../context/navigation";
import { errorMessageKey, errorSupportCode } from "../lib/errors";
import {
  extractTotpSecret,
  formatTotpSecret,
  normalizeOtp,
  validateOtp,
} from "../lib/validation";
import { AUTH_V2_PATHS } from "../routing/paths";

type Step = "intro" | "scan" | "done";

export function MfaEnrollmentPage({ forced = false }: { forced?: boolean }) {
  const { t } = useTranslation();
  const { user, status, refresh } = useAuthV2();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("intro");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [savedCodes, setSavedCodes] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const secret = totpUri ? extractTotpSecret(totpUri) : null;
  const alreadyEnabled = user?.twoFactorEnabled === true;

  function clearSensitiveState() {
    setPassword("");
    setTotpUri("");
    setBackupCodes([]);
    setCode("");
    setSavedCodes(false);
    setShowSecret(false);
    setSecretCopied(false);
  }

  async function startEnrollment() {
    setError(null);
    setPasswordError(null);
    if (password.length === 0) {
      setPasswordError(t("authV2.validation.required"));
      return;
    }

    setBusy(true);
    try {
      const result = await authV2Api.enableTwoFactor({ password });
      if (!result.totpURI || !Array.isArray(result.backupCodes)) {
        setError(new Error("INVALID_RESPONSE"));
        return;
      }
      setPassword("");
      setTotpUri(result.totpURI);
      setBackupCodes(result.backupCodes);
      setStep("scan");
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }

  async function verifyEnrollment() {
    setError(null);
    setCodeError(null);
    const codeError = validateOtp(code);
    if (codeError) {
      setCodeError(t(`authV2.validation.${codeError}`));
      return;
    }
    if (!savedCodes) return;

    setBusy(true);
    try {
      await authV2Api.verifyTotp({ code: normalizeOtp(code) });
      clearSensitiveState();
      await refresh();
      await queryClient.invalidateQueries({
        queryKey: authV2QueryKeys.mfaPolicy(),
      });
      setStep("done");
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }

  async function copySecret() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setSecretCopied(true);
      window.setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      setSecretCopied(false);
    }
  }

  if (alreadyEnabled && step !== "done") {
    return (
      <AuthShell>
        <AuthCard>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success">
            <ShieldCheck size={24} />
          </div>
          <AuthHeading
            eyebrow={t("authV2.mfa.eyebrow")}
            title={t("authV2.mfa.alreadyEnabledTitle")}
            description={t("authV2.mfa.alreadyEnabledText")}
          />
          <AuthV2Link
            to={AUTH_V2_PATHS.security}
            className="btn btn-primary w-full rounded-xl"
          >
            {t("authV2.mfa.goToSecurity")}
          </AuthV2Link>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell contentWidth={step === "scan" ? "xl" : "md"}>
      <AuthCard>
        {forced && (
          <div className="mb-4">
            <FormAlert variant="warning" title={t("authV2.mfa.requiredBannerTitle")}>
              {t("authV2.mfa.requiredBannerText")}
            </FormAlert>
          </div>
        )}

        {step === "intro" && (
          <>
            <AuthHeading
              eyebrow={t("authV2.mfa.eyebrow")}
              title={t("authV2.mfa.title")}
              description={t("authV2.mfa.subtitle")}
            />

            <div className="mb-5 grid gap-2 sm:grid-cols-2">
              <div className="flex items-start gap-2 rounded-2xl border border-base-300 bg-base-200/50 p-3">
                <Smartphone size={17} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-base-content/65">
                  {t("authV2.mfa.introAuthenticator")}
                </p>
              </div>
              <div className="flex items-start gap-2 rounded-2xl border border-base-300 bg-base-200/50 p-3">
                <KeyRound size={17} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-base-content/65">
                  {t("authV2.mfa.introRecovery")}
                </p>
              </div>
            </div>

            {error !== null && (
              <div className="mb-4">
                <FormAlert code={errorSupportCode(error)}>
                  {t(errorMessageKey(error))}
                </FormAlert>
              </div>
            )}

            <form
              className="space-y-4"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void startEnrollment();
              }}
            >
              <PasswordField
                label={t("authV2.mfa.passwordLabel")}
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError(null);
                }}
                autoComplete="current-password"
                hint={t("authV2.mfa.passwordHint")}
                error={passwordError ?? undefined}
                required
                disabled={busy}
                autoFocus
              />
              <Button type="submit" className="w-full rounded-xl" loading={busy}>
                {busy ? t("authV2.mfa.starting") : t("authV2.mfa.start")}
              </Button>
            </form>

            {status === "mfa-enrollment-required" && (
              <p className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-xs leading-relaxed text-warning">
                {t("authV2.mfa.requiredNote")}
              </p>
            )}
          </>
        )}

        {step === "scan" && (
          <>
            <AuthHeading
              eyebrow={t("authV2.mfa.eyebrow")}
              title={t("authV2.mfa.scanTitle")}
              description={t("authV2.mfa.scanText")}
            />

            {error !== null && (
              <div className="mb-4">
                <FormAlert code={errorSupportCode(error)}>
                  {t(errorMessageKey(error))}
                </FormAlert>
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)]">
              <div className="flex flex-col items-center gap-3">
                {totpUri && (
                  <QrCode
                    value={totpUri}
                    label={t("authV2.mfa.qrAlt")}
                  />
                )}
                <p className="max-w-[220px] text-center text-[11px] leading-relaxed text-base-content/50">
                  {t("authV2.mfa.qrHint")}
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-base-300 bg-base-200/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                      {t("authV2.mfa.manualKey")}
                    </p>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs gap-1 rounded-lg"
                      onClick={() => setShowSecret((current) => !current)}
                    >
                      {showSecret ? t("authV2.mfa.hideKey") : t("authV2.mfa.showKey")}
                    </button>
                  </div>
                  {secret ? (
                    <div className="mt-2 flex items-center gap-2">
                      <code
                        dir="ltr"
                        className={`flex-1 break-all rounded-lg border border-base-300 bg-base-100 px-2.5 py-2 text-xs ${
                          showSecret ? "" : "select-none blur-[5px]"
                        }`}
                      >
                        {formatTotpSecret(secret)}
                      </code>
                      <button
                        type="button"
                        className="btn btn-ghost btn-square btn-xs"
                        onClick={() => void copySecret()}
                        aria-label={t("authV2.common.copy")}
                      >
                        {secretCopied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-error">
                      {t("authV2.mfa.secretUnavailable")}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-warning/30 bg-warning/10 p-3 text-xs leading-relaxed text-warning">
                  {t("authV2.mfa.backupWarning")}
                </div>

                <RecoveryCodeList codes={backupCodes} />

                <Checkbox
                  id="auth-v2-saved-codes"
                  label={t("authV2.mfa.backupAcknowledge")}
                  checked={savedCodes}
                  onChange={(event) => setSavedCodes(event.target.checked)}
                  disabled={busy}
                />
              </div>
            </div>

            <form
              className="mt-6 space-y-3 border-t border-base-300 pt-5"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void verifyEnrollment();
              }}
            >
              <p className="text-center text-sm font-medium">
                {t("authV2.mfa.verifyTitle")}
              </p>
              <p className="text-center text-xs text-base-content/55">
                {t("authV2.mfa.verifyText")}
              </p>
              <OtpInput
                value={code}
                onChange={(value) => {
                  setCode(value);
                  if (codeError) setCodeError(null);
                }}
                label={t("authV2.mfa.verifyTitle")}
                error={codeError ?? undefined}
                disabled={busy}
                autoFocus
              />
              <Button
                type="submit"
                className="w-full rounded-xl"
                loading={busy}
                disabled={!savedCodes || code.length !== 6}
              >
                {busy ? t("authV2.mfa.verifying") : t("authV2.mfa.verify")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-xl"
                disabled={busy}
                onClick={() => {
                  clearSensitiveState();
                  setStep("intro");
                }}
              >
                <ArrowLeft size={15} className="rtl:rotate-180" />
                {t("authV2.mfa.restart")}
              </Button>
            </form>
          </>
        )}

        {step === "done" && (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success">
              <ShieldCheck size={24} />
            </div>
            <AuthHeading
              eyebrow={t("authV2.mfa.eyebrow")}
              title={t("authV2.mfa.successTitle")}
              description={t("authV2.mfa.successText")}
            />
            <AuthV2Link
              to={AUTH_V2_PATHS.security}
              className="btn btn-primary w-full rounded-xl"
            >
              {t("authV2.mfa.goToSecurity")}
            </AuthV2Link>
          </>
        )}
      </AuthCard>
    </AuthShell>
  );
}
