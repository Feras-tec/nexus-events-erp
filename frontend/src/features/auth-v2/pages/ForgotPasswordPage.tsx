import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";

import { Button } from "../../../components/atoms/Button";
import { authV2Api } from "../api";
import { AuthCard } from "../components/AuthCard";
import { AuthHeading } from "../components/AuthHeading";
import { AuthShell } from "../components/AuthShell";
import { FormAlert } from "../components/FormAlert";
import { TextField } from "../components/TextField";
import { AuthV2Link, useAuthV2Navigation } from "../context/navigation";
import {
  errorMessageKey,
  errorSupportCode,
  isOriginRejected,
  isRateLimited,
  retryAfterSeconds,
} from "../lib/errors";
import { validateEmail } from "../lib/validation";
import { AUTH_V2_PATHS } from "../routing/paths";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { navigate } = useAuthV2Navigation();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState(0);

  useEffect(() => {
    if (retrySeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRetrySeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retrySeconds]);

  async function submit() {
    if (submitting || retrySeconds > 0) return;
    setFormError(null);
    setEmailError(null);

    const emailCode = validateEmail(email);
    if (emailCode) {
      setEmailError(t(`authV2.validation.${emailCode}`));
      return;
    }

    setSubmitting(true);
    try {
      await authV2Api.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${window.location.origin}${AUTH_V2_PATHS.resetPassword}`,
      });
      setSent(true);
    } catch (error) {
      setFormError(error);
      if (isRateLimited(error)) {
        setRetrySeconds(retryAfterSeconds(error) ?? 60);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthShell>
        <AuthCard>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success">
            <CheckCircle2 size={24} />
          </div>
          <AuthHeading
            eyebrow={t("authV2.forgot.eyebrow")}
            title={t("authV2.forgot.successTitle")}
            description={t("authV2.forgot.successText")}
          />
          <p className="rounded-2xl border border-base-300 bg-base-200/50 p-3 text-sm text-base-content/65">
            {t("authV2.forgot.successHint")}
          </p>
          <div className="mt-5 space-y-2">
            <AuthV2Link
              to={AUTH_V2_PATHS.signIn}
              className="btn btn-primary w-full rounded-xl"
            >
              {t("authV2.common.backToSignIn")}
            </AuthV2Link>
            <Button
              variant="ghost"
              className="w-full rounded-xl"
              onClick={() => {
                setSent(false);
                setFormError(null);
              }}
            >
              {t("authV2.forgot.tryAnother")}
            </Button>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading
          eyebrow={t("authV2.forgot.eyebrow")}
          title={t("authV2.forgot.title")}
          description={t("authV2.forgot.subtitle")}
        />

        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {formError !== null && (
            <FormAlert
              title={
                isOriginRejected(formError)
                  ? t("authV2.errors.securityTitle")
                  : isRateLimited(formError)
                    ? t("authV2.errors.rateLimitedTitle")
                    : undefined
              }
              code={errorSupportCode(formError)}
            >
              {isRateLimited(formError)
                ? t("authV2.errors.rateLimited", { seconds: retrySeconds })
                : t(errorMessageKey(formError))}
            </FormAlert>
          )}

          <TextField
            label={t("authV2.forgot.emailLabel")}
            value={email}
            onChange={(value) => {
              setEmail(value);
              if (emailError) setEmailError(null);
            }}
            type="email"
            autoComplete="email"
            placeholder={t("authV2.forgot.emailPlaceholder")}
            error={emailError ?? undefined}
            leadingIcon={<Mail size={17} />}
            dir="ltr"
            required
            disabled={submitting}
            autoFocus
          />

          <Button
            type="submit"
            className="w-full rounded-xl"
            loading={submitting}
            disabled={retrySeconds > 0}
          >
            {submitting ? t("authV2.forgot.sending") : t("authV2.forgot.submit")}
          </Button>
        </form>

        <p className="mt-4 rounded-2xl border border-info/25 bg-info/10 p-3 text-xs leading-relaxed text-info">
          {t("authV2.forgot.note")}
        </p>

        <button
          type="button"
          className="btn btn-ghost btn-sm mt-3 w-full gap-2 rounded-xl"
          onClick={() => navigate(AUTH_V2_PATHS.signIn)}
        >
          <ArrowLeft size={15} className="rtl:rotate-180" />
          {t("authV2.common.backToSignIn")}
        </button>
      </AuthCard>
    </AuthShell>
  );
}
