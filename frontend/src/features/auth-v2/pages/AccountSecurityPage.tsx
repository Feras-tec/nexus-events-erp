import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Fingerprint,
  History,
  KeyRound,
  LockKeyhole,
  MonitorSmartphone,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from "lucide-react";

import { Badge } from "../../../components/atoms/Badge";
import { Button } from "../../../components/atoms/Button";
import { authV2Api } from "../api";
import { authV2QueryKeys } from "../api/queryKeys";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FormAlert } from "../components/FormAlert";
import { PageHeader } from "../components/PageHeader";
import { PageSection } from "../components/PageSection";
import { PasswordField } from "../components/PasswordField";
import { RoleBadge } from "../components/RoleBadge";
import { StepUpDialog } from "../components/StepUpDialog";
import { useAuthV2 } from "../context/AuthV2Provider";
import { AuthV2Link, requiresDocumentNavigation } from "../context/navigation";
import {
  errorMessageKey,
  errorSupportCode,
  isNetworkError,
} from "../lib/errors";
import {
  formatDateTime,
  initials,
  isRecentAuthentication,
} from "../lib/format";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateNewPassword,
  validatePasswordConfirmation,
} from "../lib/validation";
import { AUTH_V2_PATHS } from "../routing/paths";

type PasswordErrors = {
  current?: string;
  next?: string;
  confirmation?: string;
};

export function AccountSecurityPage() {
  const { t, i18n } = useTranslation();
  const { user, session, refresh } = useAuthV2();
  const queryClient = useQueryClient();
  const locale = i18n.resolvedLanguage ?? i18n.language ?? "de";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [revokeOthers, setRevokeOthers] = useState(true);
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [passwordError, setPasswordError] = useState<unknown>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableError, setDisableError] = useState<unknown>(null);
  const [disabling, setDisabling] = useState(false);
  const [mfaChanged, setMfaChanged] = useState(false);

  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [stepUpDone, setStepUpDone] = useState(false);

  const policyQuery = useQuery({
    queryKey: authV2QueryKeys.mfaPolicy(),
    queryFn: authV2Api.getMfaPolicy,
    retry: false,
    staleTime: 30_000,
  });

  const eventsQuery = useQuery({
    queryKey: authV2QueryKeys.securityEvents(),
    queryFn: authV2Api.listSecurityEvents,
    retry: false,
    enabled: user?.role === "OWNER",
  });

  if (!user || !session) return null;

  const policy = policyQuery.data;
  const mfaEnabled = policy?.enabled ?? user.twoFactorEnabled;
  const mfaRequired = policy?.required ?? user.twoFactorRequired;
  const deadline = policy?.deadline;
  const overdue = policy?.enrollmentOverdue === true;
  const reauthValid = isRecentAuthentication(session.reauthenticatedAt);

  async function submitPasswordChange() {
    if (changingPassword) return;
    setPasswordError(null);
    setPasswordChanged(false);

    const nextErrors: PasswordErrors = {};
    if (currentPassword.length === 0) {
      nextErrors.current = t("authV2.security.currentPasswordRequired");
    }
    const newCode = validateNewPassword(newPassword);
    if (newCode) nextErrors.next = t(`authV2.validation.${newCode}`);
    const confirmationCode = validatePasswordConfirmation(newPassword, confirmation);
    if (confirmationCode) {
      nextErrors.confirmation = t(`authV2.validation.${confirmationCode}`);
    }
    setPasswordErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setChangingPassword(true);
    try {
      await authV2Api.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: revokeOthers,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setPasswordChanged(true);
      await queryClient.invalidateQueries({
        queryKey: authV2QueryKeys.sessions(),
      });
      await refresh();
    } catch (error) {
      setPasswordError(error);
    } finally {
      setChangingPassword(false);
    }
  }

  async function disableMfa() {
    if (disabling || disablePassword.length === 0) return;
    setDisableError(null);
    setDisabling(true);
    try {
      await authV2Api.disableTwoFactor({ password: disablePassword });
      setDisablePassword("");
      setDisableOpen(false);
      setMfaChanged(true);
      await queryClient.invalidateQueries({
        queryKey: authV2QueryKeys.mfaPolicy(),
      });
      await refresh();
    } catch (error) {
      setDisableError(error);
    } finally {
      setDisabling(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("authV2.security.eyebrow")}
        title={t("authV2.security.title")}
        description={t("authV2.security.subtitle")}
        actions={
          requiresDocumentNavigation(window.location.pathname) ? (
            <Link
              to="/account/sessions"
              className="btn btn-outline btn-sm gap-2 rounded-xl"
            >
              <MonitorSmartphone size={15} />
              {t("authV2.security.manageSessions")}
            </Link>
          ) : (
            <AuthV2Link
              to={AUTH_V2_PATHS.sessions}
              className="btn btn-outline btn-sm gap-2 rounded-xl"
            >
              <MonitorSmartphone size={15} />
              {t("authV2.security.manageSessions")}
            </AuthV2Link>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PageSection
            icon={<KeyRound size={18} />}
            title={t("authV2.security.passwordTitle")}
            description={t("authV2.security.passwordText")}
          >
            <form
              className="space-y-4"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void submitPasswordChange();
              }}
            >
              {passwordChanged && (
                <FormAlert variant="success">
                  {t("authV2.security.passwordChanged")}
                </FormAlert>
              )}
              {passwordError !== null && (
                <FormAlert code={errorSupportCode(passwordError)}>
                  {t(errorMessageKey(passwordError))}
                </FormAlert>
              )}

              <PasswordField
                label={t("authV2.security.currentPassword")}
                value={currentPassword}
                onChange={(value) => {
                  setCurrentPassword(value);
                  if (passwordErrors.current) {
                    setPasswordErrors((current) => ({
                      ...current,
                      current: undefined,
                    }));
                  }
                }}
                autoComplete="current-password"
                error={passwordErrors.current}
                required
                disabled={changingPassword}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordField
                  label={t("authV2.security.newPassword")}
                  value={newPassword}
                  onChange={(value) => {
                    setNewPassword(value);
                    if (passwordErrors.next) {
                      setPasswordErrors((current) => ({
                        ...current,
                        next: undefined,
                      }));
                    }
                  }}
                  autoComplete="new-password"
                  hint={t("authV2.security.passwordHint", {
                    min: PASSWORD_MIN_LENGTH,
                    max: PASSWORD_MAX_LENGTH,
                  })}
                  error={passwordErrors.next}
                  required
                  disabled={changingPassword}
                />
                <PasswordField
                  label={t("authV2.security.confirmNewPassword")}
                  value={confirmation}
                  onChange={(value) => {
                    setConfirmation(value);
                    if (passwordErrors.confirmation) {
                      setPasswordErrors((current) => ({
                        ...current,
                        confirmation: undefined,
                      }));
                    }
                  }}
                  autoComplete="new-password"
                  error={passwordErrors.confirmation}
                  required
                  disabled={changingPassword}
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-base-300 bg-base-200/40 p-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-sm mt-0.5"
                  checked={revokeOthers}
                  onChange={(event) => setRevokeOthers(event.target.checked)}
                  disabled={changingPassword}
                />
                <span>
                  <span className="block text-sm font-medium">
                    {t("authV2.security.revokeOthers")}
                  </span>
                  <span className="mt-0.5 block text-xs text-base-content/55">
                    {t("authV2.security.revokeOthersHint")}
                  </span>
                </span>
              </label>

              <Button type="submit" loading={changingPassword}>
                {changingPassword
                  ? t("authV2.security.changing")
                  : t("authV2.security.changePassword")}
              </Button>
            </form>
          </PageSection>

          <PageSection
            icon={<Fingerprint size={18} />}
            title={t("authV2.security.mfaTitle")}
            description={t("authV2.security.mfaText")}
            actions={
              <Badge variant={mfaEnabled ? "success" : "warning"} outline>
                {mfaEnabled
                  ? t("authV2.security.mfaEnabled")
                  : t("authV2.security.mfaDisabled")}
              </Badge>
            }
          >
            {mfaChanged && (
              <div className="mb-4">
                <FormAlert variant="success">
                  {t("authV2.security.mfaChanged")}
                </FormAlert>
              </div>
            )}

            {policyQuery.isError && (
              <div className="mb-4">
                <FormAlert code={errorSupportCode(policyQuery.error)}>
                  {isNetworkError(policyQuery.error)
                    ? t("authV2.errors.network")
                    : t(errorMessageKey(policyQuery.error))}
                </FormAlert>
              </div>
            )}

            {mfaEnabled ? (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-base-content/65">
                  {t("authV2.security.mfaEnabledText")}
                </p>
                <div className="rounded-2xl border border-warning/30 bg-warning/10 p-3 text-xs leading-relaxed text-warning">
                  {t("authV2.security.backupCodesNote")}
                </div>
                <Button variant="outline" onClick={() => setDisableOpen(true)}>
                  {t("authV2.security.disable")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-base-content/65">
                  {mfaRequired
                    ? t("authV2.security.mfaRequiredText")
                    : t("authV2.security.mfaOptionalText")}
                </p>
                {mfaRequired && (
                  <div
                    className={`flex items-start gap-2 rounded-2xl border p-3 text-xs leading-relaxed ${
                      overdue
                        ? "border-error/30 bg-error/10 text-error"
                        : "border-warning/30 bg-warning/10 text-warning"
                    }`}
                  >
                    <TriangleAlert size={15} className="mt-0.5 shrink-0" />
                    <span>
                      {overdue
                        ? t("authV2.security.mfaOverdue")
                        : t("authV2.security.mfaDeadline", {
                            date: formatDateTime(deadline, locale),
                          })}
                    </span>
                  </div>
                )}
                <AuthV2Link
                  to={AUTH_V2_PATHS.mfaEnroll}
                  className="btn btn-primary rounded-xl"
                >
                  {t("authV2.security.enroll")}
                </AuthV2Link>
              </div>
            )}
          </PageSection>

          {user.role === "OWNER" && (
            <PageSection
              icon={<History size={18} />}
              title={t("authV2.security.eventsTitle")}
              description={t("authV2.security.eventsText")}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void eventsQuery.refetch()}
                  loading={eventsQuery.isFetching}
                >
                  {t("authV2.common.refresh")}
                </Button>
              }
            >
              {eventsQuery.isError ? (
                <FormAlert code={errorSupportCode(eventsQuery.error)}>
                  {t(errorMessageKey(eventsQuery.error))}
                </FormAlert>
              ) : eventsQuery.isPending ? (
                <p className="text-sm text-base-content/55">
                  {t("authV2.common.loading")}
                </p>
              ) : eventsQuery.data && eventsQuery.data.events.length > 0 ? (
                <ul className="divide-y divide-base-300">
                  {eventsQuery.data.events.slice(0, 25).map((event) => (
                    <li
                      key={event.id}
                      className="flex flex-col gap-1 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="truncate font-medium">
                          {t(`authV2.security.eventTypes.${event.eventType}`, {
                            defaultValue: event.eventType,
                          })}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-base-content/50">
                        {formatDateTime(event.createdAt, locale)}
                        {event.ip ? ` · ${event.ip}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-base-content/55">
                  {t("authV2.security.eventsEmpty")}
                </p>
              )}
            </PageSection>
          )}
        </div>

        <div className="space-y-6">
          <PageSection
            icon={<UserRound size={18} />}
            title={t("authV2.security.profileTitle")}
            description={t("authV2.security.profileText")}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                {initials(user.name, user.email)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.name}</p>
                <p dir="ltr" className="truncate text-xs text-base-content/55">
                  {user.email}
                </p>
              </div>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-base-content/55">{t("authV2.common.role")}</dt>
                <dd>
                  <RoleBadge role={user.role} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-base-content/55">
                  {t("authV2.common.status")}
                </dt>
                <dd>
                  <Badge variant={user.isActive ? "success" : "neutral"} outline>
                    {user.isActive
                      ? t("authV2.common.active")
                      : t("authV2.common.inactive")}
                  </Badge>
                </dd>
              </div>
            </dl>

            <p className="mt-4 rounded-2xl border border-base-300 bg-base-200/50 p-3 text-xs leading-relaxed text-base-content/55">
              {t("authV2.security.readOnlyNote")}
            </p>
          </PageSection>

          <PageSection
            icon={<BadgeCheck size={18} />}
            title={t("authV2.security.stepUpTitle")}
            description={t("authV2.security.stepUpText")}
          >
            <div
              className={`flex items-start gap-2 rounded-2xl border p-3 text-xs leading-relaxed ${
                reauthValid
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-warning/30 bg-warning/10 text-warning"
              }`}
            >
              <ShieldCheck size={15} className="mt-0.5 shrink-0" />
              <span>
                {reauthValid
                  ? t("authV2.security.reauthValid")
                  : t("authV2.security.reauthExpired")}
                <span className="mt-1 block opacity-70">
                  {t("authV2.security.lastVerified", {
                    date: formatDateTime(session.reauthenticatedAt, locale),
                  })}
                </span>
              </span>
            </div>

            {stepUpDone && (
              <div className="mt-3">
                <FormAlert variant="success">
                  {t("authV2.security.stepUpSuccess")}
                </FormAlert>
              </div>
            )}

            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => {
                setStepUpDone(false);
                setStepUpOpen(true);
              }}
            >
              <LockKeyhole size={15} />
              {t("authV2.security.stepUpButton")}
            </Button>
          </PageSection>
        </div>
      </div>

      <ConfirmDialog
        open={disableOpen}
        title={t("authV2.security.disableTitle")}
        description={t("authV2.security.disableText")}
        confirmLabel={t("authV2.security.disable")}
        busy={disabling}
        confirmDisabled={disablePassword.length === 0}
        onClose={() => {
          if (disabling) return;
          setDisableOpen(false);
          setDisablePassword("");
          setDisableError(null);
        }}
        onConfirm={() => void disableMfa()}
      >
        {disableError !== null && (
          <div className="mb-3">
            <FormAlert code={errorSupportCode(disableError)}>
              {t(errorMessageKey(disableError))}
            </FormAlert>
          </div>
        )}
        <PasswordField
          label={t("authV2.security.disablePassword")}
          value={disablePassword}
          onChange={setDisablePassword}
          autoComplete="current-password"
          required
          disabled={disabling}
          autoFocus
        />
      </ConfirmDialog>

      <StepUpDialog
        open={stepUpOpen}
        onClose={() => setStepUpOpen(false)}
        onVerified={async () => {
          setStepUpDone(true);
          await refresh();
        }}
      />
    </div>
  );
}
