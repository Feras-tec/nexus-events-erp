import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Info, Mail, ShieldCheck } from "lucide-react";

import { Button } from "../../../components/atoms/Button";
import { authV2Api } from "../api";
import { AuthCard } from "../components/AuthCard";
import { AuthHeading } from "../components/AuthHeading";
import { AuthShell } from "../components/AuthShell";
import { FormAlert } from "../components/FormAlert";
import { PasswordField } from "../components/PasswordField";
import { TextField } from "../components/TextField";
import { useAuthV2 } from "../context/AuthV2Provider";
import {
  AuthV2Link,
  useAuthV2Navigation,
  useAuthV2QueryParam,
} from "../context/navigation";
import {
  errorMessageKey,
  errorSupportCode,
  isOriginRejected,
  isRateLimited,
  retryAfterSeconds,
} from "../lib/errors";
import { safeReturnTo, validateEmail, validateLoginPassword } from "../lib/validation";
import { AUTH_V2_PATHS } from "../routing/paths";

type FieldErrors = {
  email?: string;
  password?: string;
};

export function LoginPage() {
  const { t } = useTranslation();
  const { status, refresh } = useAuthV2();
  const { navigate } = useAuthV2Navigation();
  const returnToParam = useAuthV2QueryParam("returnTo");
  const returnTo = safeReturnTo(returnToParam, AUTH_V2_PATHS.security);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState(0);

  useEffect(() => {
    if (status === "authenticated") {
      navigate(returnTo, { replace: true });
    } else if (status === "mfa-enrollment-required") {
      navigate(AUTH_V2_PATHS.mfaEnroll, { replace: true });
    }
  }, [navigate, returnTo, status]);

  useEffect(() => {
    if (retrySeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRetrySeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retrySeconds]);

  function validate(): boolean {
    const next: FieldErrors = {};
    const emailCode = validateEmail(email);
    const passwordCode = validateLoginPassword(password);
    if (emailCode) next.email = t(`authV2.validation.${emailCode}`);
    if (passwordCode) next.password = t(`authV2.validation.${passwordCode}`);
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (submitting || retrySeconds > 0) return;
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await authV2Api.signInEmail({
        email: email.trim(),
        password,
      });
      setPassword("");

      if (result.twoFactorRedirect) {
        navigate(
          `${AUTH_V2_PATHS.twoFactor}?returnTo=${encodeURIComponent(returnTo)}`,
          { replace: true },
        );
        return;
      }

      await refresh();
      navigate(returnTo, { replace: true });
    } catch (error) {
      setFormError(error);
      if (isRateLimited(error)) {
        setRetrySeconds(retryAfterSeconds(error) ?? 60);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const originRejected = isOriginRejected(formError);
  const rateLimited = isRateLimited(formError) || retrySeconds > 0;

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading
          eyebrow={t("authV2.login.eyebrow")}
          title={t("authV2.login.title")}
          description={t("authV2.login.subtitle")}
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
                originRejected
                  ? t("authV2.errors.securityTitle")
                  : rateLimited
                    ? t("authV2.errors.rateLimitedTitle")
                    : undefined
              }
              code={errorSupportCode(formError)}
            >
              {rateLimited
                ? t("authV2.errors.rateLimited", { seconds: retrySeconds })
                : t(errorMessageKey(formError))}
            </FormAlert>
          )}

          <TextField
            label={t("authV2.login.emailLabel")}
            value={email}
            onChange={(value) => {
              setEmail(value);
              if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: undefined }));
            }}
            type="email"
            autoComplete="email"
            placeholder={t("authV2.login.emailPlaceholder")}
            error={fieldErrors.email}
            leadingIcon={<Mail size={17} />}
            dir="ltr"
            required
            disabled={submitting}
            autoFocus
          />

          <div>
            <PasswordField
              label={t("authV2.login.passwordLabel")}
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: undefined }));
              }}
              autoComplete="current-password"
              placeholder={t("authV2.login.passwordPlaceholder")}
              error={fieldErrors.password}
              required
              disabled={submitting}
            />
            <div className="mt-2 text-end">
              <AuthV2Link
                to={AUTH_V2_PATHS.forgotPassword}
                className="link link-hover text-xs font-medium text-primary"
              >
                {t("authV2.login.forgotPassword")}
              </AuthV2Link>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl"
            loading={submitting}
            disabled={retrySeconds > 0}
          >
            {submitting ? t("authV2.login.submitting") : t("authV2.login.submit")}
            {!submitting && <ArrowRight size={16} className="rtl:rotate-180" />}
          </Button>
        </form>

        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-base-300 bg-base-200/50 p-3 text-xs leading-relaxed text-base-content/60">
          <Info size={15} className="mt-0.5 shrink-0" />
          <span>{t("authV2.login.invitationOnly")}</span>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-base-content/45">
          <ShieldCheck size={13} />
          {t("authV2.login.securityNote")}
        </p>
      </AuthCard>

      <p className="mt-4 text-center text-xs text-base-content/50">
        {t("authV2.login.needHelp")}{" "}
        <a
          className="link link-hover font-medium text-primary"
          href={`mailto:${t("authV2.login.supportEmail")}`}
        >
          {t("authV2.login.contactAdmin")}
        </a>
      </p>
    </AuthShell>
  );
}
