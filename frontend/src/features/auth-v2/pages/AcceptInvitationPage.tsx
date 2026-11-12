import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ShieldAlert, UserPlus } from "lucide-react";

import { Button } from "../../../components/atoms/Button";
import { authV2Api } from "../api";
import { AuthV2ApiError } from "../api/client";
import { AuthCard } from "../components/AuthCard";
import { AuthHeading } from "../components/AuthHeading";
import { AuthShell } from "../components/AuthShell";
import { FormAlert } from "../components/FormAlert";
import { PasswordField } from "../components/PasswordField";
import { TextField } from "../components/TextField";
import { AuthV2Link, useAuthV2QueryParam } from "../context/navigation";
import {
  errorMessageKey,
  errorSupportCode,
  isRateLimited,
  retryAfterSeconds,
} from "../lib/errors";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateNewPassword,
  validateOptionalName,
  validatePasswordConfirmation,
} from "../lib/validation";
import { AUTH_V2_PATHS } from "../routing/paths";

const TERMINAL_INVITATION_CODES = new Set([
  "INVALID_INVITATION",
  "INVITATION_REVOKED",
  "INVITATION_ALREADY_USED",
  "INVITATION_EXPIRED",
  "EMAIL_IN_USE",
  "INVITATION_NOT_FOUND",
]);

type Accepted = {
  name: string;
  email: string;
};

export function AcceptInvitationPage({ token: tokenProp }: { token?: string }) {
  const { t } = useTranslation();
  const queryToken = useAuthV2QueryParam("token");
  const token = tokenProp ?? queryToken;

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [formError, setFormError] = useState<unknown>(null);
  const [terminalError, setTerminalError] = useState<AuthV2ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState<Accepted | null>(null);
  const [retrySeconds, setRetrySeconds] = useState(0);

  useEffect(() => {
    if (retrySeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRetrySeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retrySeconds]);

  if (accepted) {
    return (
      <AuthShell>
        <AuthCard>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success">
            <CheckCircle2 size={24} />
          </div>
          <AuthHeading
            eyebrow={t("authV2.invite.eyebrow")}
            title={t("authV2.invite.successTitle")}
            description={t("authV2.invite.successText")}
          />
          <div className="rounded-2xl border border-base-300 bg-base-200/50 p-3 text-sm">
            <p className="font-semibold">{accepted.name}</p>
            <p dir="ltr" className="mt-0.5 text-base-content/60">
              {accepted.email}
            </p>
          </div>
          <AuthV2Link
            to={AUTH_V2_PATHS.signIn}
            className="btn btn-primary mt-5 w-full rounded-xl"
          >
            {t("authV2.invite.goToSignIn")}
          </AuthV2Link>
        </AuthCard>
      </AuthShell>
    );
  }

  if (!token || token.length < 20 || terminalError !== null) {
    return (
      <AuthShell>
        <AuthCard>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-error/10 text-error">
            <ShieldAlert size={24} />
          </div>
          <AuthHeading
            eyebrow={t("authV2.invite.eyebrow")}
            title={t("authV2.invite.invalidTitle")}
            description={
              terminalError
                ? t(errorMessageKey(terminalError))
                : t("authV2.invite.tokenMissing")
            }
          />
          {terminalError && (
            <p className="mb-4 text-[11px] text-base-content/45">
              <code dir="ltr">{terminalError.code}</code>
            </p>
          )}
          <p className="rounded-2xl border border-base-300 bg-base-200/50 p-3 text-xs leading-relaxed text-base-content/60">
            {t("authV2.invite.contactAdmin")}
          </p>
          <AuthV2Link
            to={AUTH_V2_PATHS.signIn}
            className="btn btn-ghost mt-4 w-full rounded-xl"
          >
            {t("authV2.common.backToSignIn")}
          </AuthV2Link>
        </AuthCard>
      </AuthShell>
    );
  }

  async function submit() {
    if (submitting || retrySeconds > 0) return;
    setFormError(null);
    setNameError(null);
    setPasswordError(null);
    setConfirmationError(null);

    const nameCode = validateOptionalName(name);
    const passwordCode = validateNewPassword(password);
    const confirmationCode = validatePasswordConfirmation(password, confirmation);
    let invalid = false;
    if (nameCode) {
      setNameError(t(`authV2.validation.${nameCode}`));
      invalid = true;
    }
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
      const result = await authV2Api.acceptInvitation({
        token: token!,
        ...(name.trim().length > 0 ? { name: name.trim() } : {}),
        password,
      });
      setPassword("");
      setConfirmation("");
      setAccepted({ name: result.user.name, email: result.user.email });
    } catch (error) {
      if (error instanceof AuthV2ApiError) {
        if (TERMINAL_INVITATION_CODES.has(error.code)) {
          setTerminalError(error);
          return;
        }
        if (isRateLimited(error)) {
          setRetrySeconds(retryAfterSeconds(error) ?? 60);
        }
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
          eyebrow={t("authV2.invite.eyebrow")}
          title={t("authV2.invite.title")}
          description={t("authV2.invite.subtitle")}
        />

        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-info/25 bg-info/10 p-3 text-xs leading-relaxed text-info">
          <UserPlus size={16} className="mt-0.5 shrink-0" />
          {t("authV2.invite.note")}
        </div>

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
              {isRateLimited(formError)
                ? t("authV2.errors.rateLimited", { seconds: retrySeconds })
                : t(errorMessageKey(formError))}
            </FormAlert>
          )}

          <TextField
            label={t("authV2.invite.nameLabel")}
            value={name}
            onChange={(value) => {
              setName(value);
              if (nameError) setNameError(null);
            }}
            autoComplete="name"
            placeholder={t("authV2.invite.namePlaceholder")}
            hint={t("authV2.invite.nameHint")}
            error={nameError ?? undefined}
            maxLength={140}
            disabled={submitting}
            autoFocus
          />

          <div>
            <PasswordField
              label={t("authV2.invite.passwordLabel")}
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (passwordError) setPasswordError(null);
              }}
              autoComplete="new-password"
              error={passwordError ?? undefined}
              hint={t("authV2.invite.passwordHint", {
                min: PASSWORD_MIN_LENGTH,
                max: PASSWORD_MAX_LENGTH,
              })}
              required
              disabled={submitting}
            />
          </div>

          <PasswordField
            label={t("authV2.invite.confirmPassword")}
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

          <Button
            type="submit"
            className="w-full rounded-xl"
            loading={submitting}
            disabled={retrySeconds > 0}
          >
            {submitting ? t("authV2.invite.submitting") : t("authV2.invite.submit")}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
