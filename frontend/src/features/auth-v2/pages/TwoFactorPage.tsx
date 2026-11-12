import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";

import { Button } from "../../../components/atoms/Button";
import { authV2Api } from "../api";
import { AuthCard } from "../components/AuthCard";
import { AuthHeading } from "../components/AuthHeading";
import { AuthShell } from "../components/AuthShell";
import { FormAlert } from "../components/FormAlert";
import { OtpInput } from "../components/OtpInput";
import { TextField } from "../components/TextField";
import { useAuthV2 } from "../context/AuthV2Provider";
import {
  AuthV2Link,
  useAuthV2Navigation,
  useAuthV2QueryParam,
} from "../context/navigation";
import { errorMessageKey, errorSupportCode } from "../lib/errors";
import {
  normalizeOtp,
  normalizeRecoveryCode,
  safeReturnTo,
  validateOtp,
  validateRecoveryCode,
} from "../lib/validation";
import { AUTH_V2_PATHS, signInPath } from "../routing/paths";

type Mode = "totp" | "recovery";

export function TwoFactorPage() {
  const { t } = useTranslation();
  const { status, refresh } = useAuthV2();
  const { navigate } = useAuthV2Navigation();
  const returnToParam = useAuthV2QueryParam("returnTo");
  const returnTo = safeReturnTo(returnToParam, AUTH_V2_PATHS.security);

  const [mode, setMode] = useState<Mode>("totp");
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      navigate(returnTo, { replace: true });
    } else if (status === "mfa-enrollment-required") {
      navigate(AUTH_V2_PATHS.mfaEnroll, { replace: true });
    }
  }, [navigate, returnTo, status]);

  function switchMode(next: Mode) {
    setMode(next);
    setCode("");
    setRecoveryCode("");
    setFieldError(null);
    setFormError(null);
  }

  async function submit() {
    if (submitting) return;
    setFormError(null);
    setFieldError(null);

    if (mode === "totp") {
      const codeError = validateOtp(code);
      if (codeError) {
        setFieldError(t(`authV2.validation.${codeError}`));
        return;
      }
    } else if (validateRecoveryCode(recoveryCode)) {
      setFieldError(t("authV2.validation.required"));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "totp") {
        await authV2Api.verifyTotp({ code: normalizeOtp(code) });
      } else {
        await authV2Api.verifyBackupCode({
          code: normalizeRecoveryCode(recoveryCode),
        });
      }

      setCode("");
      setRecoveryCode("");
      await refresh();
      navigate(returnTo, { replace: true });
    } catch (error) {
      setFormError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading
          eyebrow={t("authV2.twoFactor.eyebrow")}
          title={t("authV2.twoFactor.title")}
          description={t("authV2.twoFactor.subtitle")}
        />

        <div className="mb-5 flex rounded-xl border border-base-300 bg-base-200/60 p-1">
          <button
            type="button"
            onClick={() => switchMode("totp")}
            aria-pressed={mode === "totp"}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "totp"
                ? "bg-base-100 text-base-content shadow-sm"
                : "text-base-content/55"
            }`}
          >
            <ShieldCheck size={15} />
            {t("authV2.twoFactor.useTotp")}
          </button>
          <button
            type="button"
            onClick={() => switchMode("recovery")}
            aria-pressed={mode === "recovery"}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "recovery"
                ? "bg-base-100 text-base-content shadow-sm"
                : "text-base-content/55"
            }`}
          >
            <KeyRound size={15} />
            {t("authV2.twoFactor.useRecoveryCode")}
          </button>
        </div>

        <form
          className="space-y-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {formError !== null && (
            <FormAlert code={errorSupportCode(formError)}>
              {t(errorMessageKey(formError))}
            </FormAlert>
          )}

          {mode === "totp" ? (
            <div>
              <p className="mb-2 text-center text-sm font-medium">
                {t("authV2.twoFactor.codeLabel")}
              </p>
              <OtpInput
                value={code}
                onChange={(value) => {
                  setCode(value);
                  if (fieldError) setFieldError(null);
                }}
                label={t("authV2.twoFactor.codeLabel")}
                error={fieldError ?? undefined}
                disabled={submitting}
                autoFocus
              />
              <p className="mt-2 text-center text-xs text-base-content/55">
                {t("authV2.twoFactor.totpHint")}
              </p>
            </div>
          ) : (
            <div>
              <TextField
                label={t("authV2.twoFactor.recoveryLabel")}
                value={recoveryCode}
                onChange={(value) => {
                  setRecoveryCode(value);
                  if (fieldError) setFieldError(null);
                }}
                placeholder={t("authV2.twoFactor.recoveryPlaceholder")}
                autoComplete="one-time-code"
                error={fieldError ?? undefined}
                hint={t("authV2.twoFactor.recoveryHint")}
                dir="ltr"
                spellCheck={false}
                required
                disabled={submitting}
                autoFocus
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full rounded-xl"
            loading={submitting}
            disabled={
              submitting ||
              (mode === "totp" ? code.length !== 6 : recoveryCode.trim().length === 0)
            }
          >
            {submitting
              ? t("authV2.twoFactor.submitting")
              : t("authV2.twoFactor.submit")}
          </Button>
        </form>

        <div className="mt-5 rounded-2xl border border-info/25 bg-info/10 p-3 text-xs leading-relaxed text-info">
          {t("authV2.twoFactor.securityNote")}
        </div>

        <AuthV2Link
          to={signInPath(returnTo)}
          className="btn btn-ghost btn-sm mt-4 w-full gap-2 rounded-xl"
        >
          <ArrowLeft size={15} className="rtl:rotate-180" />
          {t("authV2.twoFactor.back")}
        </AuthV2Link>
      </AuthCard>

      <p className="mt-4 text-center text-xs text-base-content/50">
        {t("authV2.twoFactor.lostAccess")}
      </p>
    </AuthShell>
  );
}
