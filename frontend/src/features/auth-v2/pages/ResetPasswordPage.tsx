import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ShieldAlert, ShieldCheck } from "lucide-react";

import { Button } from "../../../components/atoms/Button";
import { authV2Api } from "../api";
import { AuthV2ApiError } from "../api/client";
import { AuthCard } from "../components/AuthCard";
import { AuthHeading } from "../components/AuthHeading";
import { AuthShell } from "../components/AuthShell";
import { FormAlert } from "../components/FormAlert";
import { PasswordField } from "../components/PasswordField";
import {
  AuthV2Link,
  useAuthV2Navigation,
  useAuthV2QueryParam,
} from "../context/navigation";
import { errorMessageKey, errorSupportCode } from "../lib/errors";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  getPasswordStrength,
  validateNewPassword,
  validatePasswordConfirmation,
} from "../lib/validation";
import { AUTH_V2_PATHS } from "../routing/paths";

export function ResetPasswordPage({ token: tokenProp, firstPassword = false }: { token?: string; firstPassword?: boolean }) {
  const { t } = useTranslation();
  const { navigate } = useAuthV2Navigation();
  const queryToken = useAuthV2QueryParam("token");
  // Ein Ersteinrichtungs-Token bleibt im Fragment und wird nicht als URL-Pfad oder Query an Server gesendet.
  const [fragmentToken] = useState(() => firstPassword ? new URLSearchParams(window.location.hash.slice(1)).get("token") : null);
  useEffect(() => {
    if (firstPassword) window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  }, [firstPassword]);
  const token = firstPassword ? fragmentToken ?? undefined : tokenProp ?? queryToken ?? undefined;
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [formError, setFormError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tokenRejected, setTokenRejected] = useState(false);

  const strength = getPasswordStrength(password);
  const tokenMissing = !token || token.length < 10;

  if (tokenMissing || tokenRejected) {
    return (
      <AuthShell>
        <AuthCard>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-error/10 text-error">
            <ShieldAlert size={24} />
          </div>
          <AuthHeading
            eyebrow={t("authV2.reset.eyebrow")}
            title={t("authV2.reset.invalidTitle")}
            description={t("authV2.reset.invalidText")}
          />
          <div className="space-y-2">
            <AuthV2Link
              to={AUTH_V2_PATHS.forgotPassword}
              className="btn btn-primary w-full rounded-xl"
            >
              {t("authV2.reset.requestNew")}
            </AuthV2Link>
            <AuthV2Link
              to={AUTH_V2_PATHS.signIn}
              className="btn btn-ghost w-full rounded-xl"
            >
              {t("authV2.common.backToSignIn")}
            </AuthV2Link>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  async function submit() {
    if (submitting) return;
    setFormError(null);
    setPasswordError(null);
    setConfirmationError(null);

    const passwordCode = validateNewPassword(password);
    const confirmationCode = validatePasswordConfirmation(password, confirmation);
    let invalid = false;
    if (passwordCode) {
      setPasswordError(t(`authV2.validation.${passwordCode}`));
      invalid = true;
    }
    if (confirmationCode) {
      setConfirmationError(t(`authV2.validation.${confirmationCode}`));
      invalid = true;
    }
    if (invalid) return;

    setSubmitting(true);
    try {
      await (firstPassword ? authV2Api.completeFirstPassword : authV2Api.resetPassword)({
        token: token!,
        newPassword: password,
      });
      setPassword("");
      setConfirmation("");
      navigate(`${AUTH_V2_PATHS.signedOut}?reason=password-reset`, {
        replace: true,
      });
    } catch (error) {
      if (
        error instanceof AuthV2ApiError &&
        (error.code === "INVALID_TOKEN" || error.code === "INVALID_PASSWORD")
      ) {
        setTokenRejected(true);
        return;
      }
      setFormError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading
          eyebrow={t("authV2.reset.eyebrow")}
          title={firstPassword ? "Set up your first password" : t("authV2.reset.title")}
          description={t("authV2.reset.subtitle")}
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
            <FormAlert code={errorSupportCode(formError)}>
              {t(errorMessageKey(formError))}
            </FormAlert>
          )}

          <div>
            <PasswordField
              label={t("authV2.reset.newPassword")}
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (passwordError) setPasswordError(null);
              }}
              autoComplete="new-password"
              error={passwordError ?? undefined}
              hint={t("authV2.reset.passwordHint", {
                min: PASSWORD_MIN_LENGTH,
                max: PASSWORD_MAX_LENGTH,
              })}
              required
              disabled={submitting}
              autoFocus
            />

            <div className="mt-2 flex items-center gap-2" aria-hidden="true">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <span
                    key={level}
                    className={`h-1.5 flex-1 rounded-full ${
                      password.length > 0 && strength.score >= level
                        ? strength.score >= 4
                          ? "bg-success"
                          : strength.score === 3
                            ? "bg-info"
                            : "bg-warning"
                        : "bg-base-300"
                    }`}
                  />
                ))}
              </div>
              <span className="w-20 text-end text-[11px] text-base-content/55">
                {password.length > 0
                  ? t(`authV2.reset.strength.${strength.key}`)
                  : ""}
              </span>
            </div>

            <ul className="mt-2 space-y-1 text-[11px] text-base-content/55">
              <li className="flex items-center gap-1.5">
                <Check
                  size={12}
                  className={
                    password.length >= PASSWORD_MIN_LENGTH
                      ? "text-success"
                      : "text-base-content/30"
                  }
                />
                {t("authV2.reset.requirements.length", {
                  min: PASSWORD_MIN_LENGTH,
                })}
              </li>
              <li className="flex items-center gap-1.5">
                <Check
                  size={12}
                  className={
                    password.length > 0 && password.length <= PASSWORD_MAX_LENGTH
                      ? "text-success"
                      : "text-base-content/30"
                  }
                />
                {t("authV2.reset.requirements.maxLength", {
                  max: PASSWORD_MAX_LENGTH,
                })}
              </li>
            </ul>
          </div>

          <PasswordField
            label={t("authV2.reset.confirmPassword")}
            value={confirmation}
            onChange={(value) => {
              setConfirmation(value);
              if (confirmationError) setConfirmationError(null);
            }}
            autoComplete="new-password"
            error={confirmationError ?? undefined}
            required
            disabled={submitting}
          />

          <Button type="submit" className="w-full rounded-xl" loading={submitting}>
            {submitting ? t("authV2.reset.submitting") : t("authV2.reset.submit")}
          </Button>
        </form>

        <p className="mt-4 flex items-start gap-2 rounded-2xl border border-base-300 bg-base-200/50 p-3 text-xs leading-relaxed text-base-content/60">
          <ShieldCheck size={15} className="mt-0.5 shrink-0" />
          {t("authV2.reset.note")}
        </p>
      </AuthCard>
    </AuthShell>
  );
}
