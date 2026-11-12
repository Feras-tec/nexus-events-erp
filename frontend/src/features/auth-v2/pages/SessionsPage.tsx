import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock3,
  Laptop,
  LogOut,
  MonitorSmartphone,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";

import { Badge } from "../../../components/atoms/Badge";
import { Button } from "../../../components/atoms/Button";
import { authV2Api } from "../api";
import { authV2QueryKeys } from "../api/queryKeys";
import type { SessionRecord } from "../api/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FormAlert } from "../components/FormAlert";
import { PageHeader } from "../components/PageHeader";
import { PageSection } from "../components/PageSection";
import { useAuthV2 } from "../context/AuthV2Provider";
import { useAuthV2Navigation } from "../context/navigation";
import { errorMessageKey, errorSupportCode } from "../lib/errors";
import {
  formatDateTime,
  isExpired,
  parseUserAgent,
} from "../lib/format";
import { AUTH_V2_PATHS } from "../routing/paths";

export function SessionsPage() {
  const { t, i18n } = useTranslation();
  const { logout } = useAuthV2();
  const { navigate } = useAuthV2Navigation();
  const queryClient = useQueryClient();
  const locale = i18n.resolvedLanguage ?? i18n.language ?? "de";

  const sessionsQuery = useQuery({
    queryKey: authV2QueryKeys.sessions(),
    queryFn: authV2Api.listSessions,
    retry: false,
  });

  const [target, setTarget] = useState<SessionRecord | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<unknown>(null);
  const [revokeOthersOpen, setRevokeOthersOpen] = useState(false);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [revokeOthersError, setRevokeOthersError] = useState<unknown>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function revokeTarget() {
    if (!target || revoking) return;
    setRevokeError(null);
    setRevoking(true);
    try {
      await authV2Api.revokeSession(target.id);
      setTarget(null);
      setSuccess(t("authV2.sessions.revokeSuccess"));
      await queryClient.invalidateQueries({
        queryKey: authV2QueryKeys.sessions(),
      });
    } catch (error) {
      setRevokeError(error);
    } finally {
      setRevoking(false);
    }
  }

  async function revokeOthers() {
    if (revokingOthers) return;
    setRevokeOthersError(null);
    setRevokingOthers(true);
    try {
      const result = await authV2Api.revokeOtherSessions();
      setRevokeOthersOpen(false);
      setSuccess(
        t("authV2.sessions.revokeOthersSuccess", { count: result.revoked }),
      );
      await queryClient.invalidateQueries({
        queryKey: authV2QueryKeys.sessions(),
      });
    } catch (error) {
      setRevokeOthersError(error);
    } finally {
      setRevokingOthers(false);
    }
  }

  async function signOutCurrent() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      navigate(`${AUTH_V2_PATHS.signedOut}?reason=logout`, { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  const sessions = sessionsQuery.data?.sessions ?? [];
  const currentSessionId = sessionsQuery.data?.currentSessionId;
  const otherSessions = sessions.filter(
    (session) => session.id !== currentSessionId,
  );

  return (
    <div>
      <PageHeader
        eyebrow={t("authV2.sessions.eyebrow")}
        title={t("authV2.sessions.title")}
        description={t("authV2.sessions.subtitle")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSuccess(null);
              void sessionsQuery.refetch();
            }}
            loading={sessionsQuery.isFetching}
          >
            <RefreshCcw size={14} />
            {t("authV2.common.refresh")}
          </Button>
        }
      />

      {success && (
        <div className="mb-4">
          <FormAlert variant="success">{success}</FormAlert>
        </div>
      )}

      <PageSection
        icon={<MonitorSmartphone size={18} />}
        title={t("authV2.sessions.listTitle")}
        description={t("authV2.sessions.listText")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSuccess(null);
              setRevokeOthersError(null);
              setRevokeOthersOpen(true);
            }}
            disabled={otherSessions.length === 0}
          >
            <Trash2 size={14} />
            {t("authV2.sessions.revokeOthers")}
          </Button>
        }
      >
        {sessionsQuery.isError ? (
          <FormAlert code={errorSupportCode(sessionsQuery.error)}>
            {t(errorMessageKey(sessionsQuery.error))}
          </FormAlert>
        ) : sessionsQuery.isPending ? (
          <div className="space-y-3" role="status" aria-live="polite">
            {[0, 1].map((index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-base-200"
              />
            ))}
            <span className="sr-only">{t("authV2.common.loading")}</span>
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-base-content/55">
            {t("authV2.sessions.empty")}
          </p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((session) => {
              const isCurrent = session.id === currentSessionId;
              const device = parseUserAgent(session.userAgent);
              const expired = isExpired(session.expiresAt);
              return (
                <li
                  key={session.id}
                  className={`rounded-2xl border p-4 ${
                    isCurrent
                      ? "border-primary/35 bg-primary/[0.04]"
                      : "border-base-300 bg-base-100"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isCurrent
                            ? "bg-primary/10 text-primary"
                            : "bg-base-200 text-base-content/60"
                        }`}
                      >
                        {device.mobile ? (
                          <Smartphone size={18} />
                        ) : (
                          <Laptop size={18} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
                            {device.browser ?? t("authV2.sessions.unknownDevice")}
                            {device.os ? ` · ${device.os}` : ""}
                          </p>
                          {isCurrent && (
                            <Badge variant="primary" outline>
                              {t("authV2.sessions.currentBadge")}
                            </Badge>
                          )}
                          {expired && (
                            <Badge variant="neutral" outline>
                              {t("authV2.sessions.expiredBadge")}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-base-content/50">
                          {session.userAgent ?? t("authV2.sessions.unknownDevice")}
                        </p>
                        <dl className="mt-2 grid gap-x-4 gap-y-1 text-[11px] text-base-content/55 sm:grid-cols-2">
                          <div className="flex items-center gap-1.5">
                            <Clock3 size={12} />
                            <dt className="sr-only">
                              {t("authV2.sessions.created")}
                            </dt>
                            <dd>
                              {t("authV2.sessions.created")}:{" "}
                              {formatDateTime(session.createdAt, locale)}
                            </dd>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock3 size={12} />
                            <dt className="sr-only">
                              {t("authV2.sessions.lastSeen")}
                            </dt>
                            <dd>
                              {t("authV2.sessions.lastSeen")}:{" "}
                              {formatDateTime(
                                session.lastSeenAt ?? session.createdAt,
                                locale,
                              )}
                            </dd>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock3 size={12} />
                            <dt className="sr-only">
                              {t("authV2.sessions.expires")}
                            </dt>
                            <dd>
                              {t("authV2.sessions.expires")}:{" "}
                              {formatDateTime(session.expiresAt, locale)}
                            </dd>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <dt className="sr-only">{t("authV2.sessions.ip")}</dt>
                            <dd dir="ltr">
                              {t("authV2.sessions.ip")}:{" "}
                              {session.ipAddress ?? t("authV2.common.unknown")}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {isCurrent ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLogoutOpen(true)}
                        >
                          <LogOut size={14} />
                          {t("authV2.sessions.signOutCurrent")}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error"
                          onClick={() => {
                            setSuccess(null);
                            setRevokeError(null);
                            setTarget(session);
                          }}
                        >
                          <Trash2 size={14} />
                          {t("authV2.sessions.revoke")}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-4 flex items-start gap-2 rounded-2xl border border-base-300 bg-base-200/50 p-3 text-xs leading-relaxed text-base-content/55">
          <ShieldCheck size={15} className="mt-0.5 shrink-0" />
          {t("authV2.sessions.securityNote")}
        </p>
      </PageSection>

      <ConfirmDialog
        open={target !== null}
        title={t("authV2.sessions.revokeTitle")}
        description={t("authV2.sessions.revokeText")}
        confirmLabel={t("authV2.sessions.revoke")}
        busy={revoking}
        onClose={() => {
          if (revoking) return;
          setTarget(null);
          setRevokeError(null);
        }}
        onConfirm={() => void revokeTarget()}
      >
        {revokeError !== null && (
          <FormAlert code={errorSupportCode(revokeError)}>
            {t(errorMessageKey(revokeError))}
          </FormAlert>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={revokeOthersOpen}
        title={t("authV2.sessions.revokeOthersTitle")}
        description={t("authV2.sessions.revokeOthersText")}
        confirmLabel={t("authV2.sessions.revokeOthers")}
        variant="warning"
        busy={revokingOthers}
        onClose={() => {
          if (revokingOthers) return;
          setRevokeOthersOpen(false);
          setRevokeOthersError(null);
        }}
        onConfirm={() => void revokeOthers()}
      >
        {revokeOthersError !== null && (
          <FormAlert code={errorSupportCode(revokeOthersError)}>
            {t(errorMessageKey(revokeOthersError))}
          </FormAlert>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={logoutOpen}
        title={t("authV2.sessions.signOutCurrentTitle")}
        description={t("authV2.sessions.signOutCurrentText")}
        confirmLabel={t("authV2.common.signOut")}
        busy={loggingOut}
        onClose={() => {
          if (loggingOut) return;
          setLogoutOpen(false);
        }}
        onConfirm={() => void signOutCurrent()}
      />
    </div>
  );
}
