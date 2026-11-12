import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Crown,
  Fingerprint,
  Lock,
  Mail,
  Pencil,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShieldX,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { Badge } from "../../../components/atoms/Badge";
import { Button } from "../../../components/atoms/Button";
import { Checkbox } from "../../../components/atoms/Checkbox";
import { Select } from "../../../components/atoms/Select";
import { authV2Api } from "../api";
import { authV2QueryKeys } from "../api/queryKeys";
import {
  AUTH_V2_ADMIN_MANAGEABLE_ROLES,
  AUTH_V2_ROLES,
  type AdminUser,
  type Invitation,
} from "../api/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FormAlert } from "../components/FormAlert";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { PageSection } from "../components/PageSection";
import { RoleBadge } from "../components/RoleBadge";
import { StepUpDialog } from "../components/StepUpDialog";
import { TextField } from "../components/TextField";
import {
  canManageEmployees,
  canManageTargetRole,
  useAuthV2,
} from "../context/AuthV2Provider";
import { useAuthV2Navigation } from "../context/navigation";
import {
  errorMessageKey,
  errorSupportCode,
  isReauthRequired,
} from "../lib/errors";
import { formatDate, initials } from "../lib/format";
import { validateEmail } from "../lib/validation";
import { AUTH_V2_PATHS } from "../routing/paths";

type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

const ROLE_VALUES = new Set<string>(AUTH_V2_ROLES);

function invitationStatus(invitation: Invitation): InvitationStatus {
  if (invitation.revokedAt) return "revoked";
  if (invitation.acceptedAt) return "accepted";
  if (new Date(invitation.expiresAt).getTime() <= Date.now()) return "expired";
  return "pending";
}

export function EmployeeAccountsPage() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthV2();
  const { navigate } = useAuthV2Navigation();
  const queryClient = useQueryClient();
  const locale = i18n.resolvedLanguage ?? i18n.language ?? "de";
  const editTitleId = useId();

  const allowed = canManageEmployees(user?.role);
  const actorRole = user?.role ?? "";

  const usersQuery = useQuery({
    queryKey: authV2QueryKeys.adminUsers(),
    queryFn: authV2Api.listAdminUsers,
    retry: false,
    enabled: allowed,
  });

  const invitationsQuery = useQuery({
    queryKey: authV2QueryKeys.invitations(),
    queryFn: authV2Api.listInvitations,
    retry: false,
    enabled: allowed,
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [success, setSuccess] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<unknown>(null);
  const [stepUpOpen, setStepUpOpen] = useState(false);

  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<unknown>(null);

  const [mfaTarget, setMfaTarget] = useState<AdminUser | null>(null);
  const [savingMfa, setSavingMfa] = useState(false);
  const [mfaError, setMfaError] = useState<unknown>(null);

  const [revokeTarget, setRevokeTarget] = useState<AdminUser | null>(null);
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [revokeError, setRevokeError] = useState<unknown>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EMPLOYEE");
  const [inviteEmailError, setInviteEmailError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<unknown>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<{
    email: string;
    delivery: "email" | "outbox";
  } | null>(null);

  const [invitationTarget, setInvitationTarget] = useState<Invitation | null>(
    null,
  );
  const [revokingInvitation, setRevokingInvitation] = useState(false);
  const [invitationError, setInvitationError] = useState<unknown>(null);

  const [ownerOpen, setOwnerOpen] = useState(false);
  const [ownerTargetId, setOwnerTargetId] = useState("");
  const [ownerConfirmEmail, setOwnerConfirmEmail] = useState("");
  const [ownerError, setOwnerError] = useState<unknown>(null);
  const [transferring, setTransferring] = useState(false);

  if (!user) return null;

  if (!allowed) {
    return (
      <div>
        <PageHeader
          eyebrow={t("authV2.admin.eyebrow")}
          title={t("authV2.admin.title")}
        />
        <PageSection
          icon={<ShieldX size={18} />}
          title={t("authV2.admin.accessDeniedTitle")}
          tone="danger"
        >
          <p className="text-sm leading-relaxed text-base-content/65">
            {t("authV2.admin.accessDeniedText")}
          </p>
        </PageSection>
      </div>
    );
  }

  const users = usersQuery.data?.users ?? [];
  const invitations = invitationsQuery.data?.invitations ?? [];
  const assignableRoles =
    actorRole === "OWNER" ? AUTH_V2_ROLES : AUTH_V2_ADMIN_MANAGEABLE_ROLES;

  const roleOptions = [
    { value: "ALL", label: t("authV2.admin.allRoles") },
    ...AUTH_V2_ROLES.map((role) => ({
      value: role,
      label: t(`authV2.roles.${role}`, { defaultValue: role }),
    })),
  ];

  const assignableOptions = assignableRoles.map((role) => ({
    value: role,
    label: t(`authV2.roles.${role}`, { defaultValue: role }),
  }));

  const statusOptions = [
    { value: "ALL", label: t("authV2.admin.allStatuses") },
    { value: "ACTIVE", label: t("authV2.common.active") },
    { value: "INACTIVE", label: t("authV2.common.inactive") },
  ];

  const filteredUsers = users.filter((candidate) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      candidate.name.toLowerCase().includes(query) ||
      candidate.email.toLowerCase().includes(query);
    const matchesRole = roleFilter === "ALL" || candidate.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" ? candidate.isActive : !candidate.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = users.filter((candidate) => candidate.isActive).length;
  const mfaCount = users.filter(
    (candidate) => candidate.twoFactorRequired,
  ).length;

  async function invalidateAdminData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: authV2QueryKeys.adminUsers() }),
      queryClient.invalidateQueries({ queryKey: authV2QueryKeys.invitations() }),
    ]);
  }

  function handleFailure(
    error: unknown,
    setLocalError: (value: unknown) => void,
    close: () => void,
  ) {
    if (isReauthRequired(error)) {
      setGlobalError(error);
      close();
      return;
    }
    setLocalError(error);
  }

  function openEdit(target: AdminUser) {
    setEditTarget(target);
    setEditRole(target.role);
    setEditActive(target.isActive);
    setEditError(null);
    setSuccess(null);
  }

  async function saveEdit() {
    if (!editTarget || savingEdit) return;
    const changes: { role?: string; isActive?: boolean } = {};
    if (editRole !== editTarget.role) changes.role = editRole;
    if (editActive !== editTarget.isActive) changes.isActive = editActive;
    if (changes.role === undefined && changes.isActive === undefined) return;

    setSavingEdit(true);
    setEditError(null);
    try {
      await authV2Api.updateAdminUser(editTarget.id, changes);
      setEditTarget(null);
      setSuccess(t("authV2.admin.updated"));
      await invalidateAdminData();
    } catch (error) {
      handleFailure(error, setEditError, () => setEditTarget(null));
    } finally {
      setSavingEdit(false);
    }
  }

  async function saveMfa() {
    if (!mfaTarget || savingMfa) return;
    const nextRequired = !mfaTarget.twoFactorRequired;
    setSavingMfa(true);
    setMfaError(null);
    try {
      await authV2Api.updateUserMfaRequirement(mfaTarget.id, nextRequired);
      setMfaTarget(null);
      setSuccess(t("authV2.admin.mfaUpdated"));
      await invalidateAdminData();
    } catch (error) {
      handleFailure(error, setMfaError, () => setMfaTarget(null));
    } finally {
      setSavingMfa(false);
    }
  }

  async function revokeUserSessions() {
    if (!revokeTarget || revokingSessions) return;
    setRevokingSessions(true);
    setRevokeError(null);
    try {
      const result = await authV2Api.revokeUserSessions(revokeTarget.id);
      setRevokeTarget(null);
      setSuccess(
        t("authV2.admin.sessionsRevoked", { count: result.revoked }),
      );
      await invalidateAdminData();
    } catch (error) {
      handleFailure(error, setRevokeError, () => setRevokeTarget(null));
    } finally {
      setRevokingSessions(false);
    }
  }

  async function submitInvitation() {
    if (inviting) return;
    setInviteError(null);
    setInviteSuccess(null);
    const emailCode = validateEmail(inviteEmail);
    if (emailCode) {
      setInviteEmailError(t(`authV2.validation.${emailCode}`));
      return;
    }
    setInviteEmailError(null);
    setInviting(true);
    try {
      const result = await authV2Api.createInvitation({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteSuccess({
        email: result.invitation.email,
        delivery: result.delivery,
      });
      setInviteEmail("");
      await queryClient.invalidateQueries({
        queryKey: authV2QueryKeys.invitations(),
      });
    } catch (error) {
      if (isReauthRequired(error)) {
        setGlobalError(error);
      }
      setInviteError(error);
    } finally {
      setInviting(false);
    }
  }

  async function revokeInvitation() {
    if (!invitationTarget || revokingInvitation) return;
    setRevokingInvitation(true);
    setInvitationError(null);
    try {
      await authV2Api.revokeInvitation(invitationTarget.id);
      setInvitationTarget(null);
      setSuccess(t("authV2.admin.invitationRevoked"));
      await queryClient.invalidateQueries({
        queryKey: authV2QueryKeys.invitations(),
      });
    } catch (error) {
      handleFailure(error, setInvitationError, () =>
        setInvitationTarget(null),
      );
    } finally {
      setRevokingInvitation(false);
    }
  }

  const ownerCandidates = users.filter(
    (candidate) => candidate.isActive && candidate.id !== user.id,
  );
  const ownerTarget = ownerCandidates.find(
    (candidate) => candidate.id === ownerTargetId,
  );

  async function transferOwner() {
    if (!ownerTarget || transferring) return;
    setTransferring(true);
    setOwnerError(null);
    try {
      await authV2Api.transferOwnership(ownerTarget.id);
      setOwnerOpen(false);
      await logoutAndLeave();
    } catch (error) {
      handleFailure(error, setOwnerError, () => setOwnerOpen(false));
    } finally {
      setTransferring(false);
    }
  }

  async function logoutAndLeave() {
    // The transfer revokes both sessions. Even if sign-out returns 401, the
    // local cache is cleared and the user is sent to the signed-out screen.
    await logout();
    navigate(`${AUTH_V2_PATHS.signedOut}?reason=owner-transferred`, {
      replace: true,
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("authV2.admin.eyebrow")}
        title={t("authV2.admin.title")}
        description={t("authV2.admin.subtitle")}
        actions={
          <Button
            variant="outline"
            size="sm"
            loading={usersQuery.isFetching || invitationsQuery.isFetching}
            onClick={() => {
              setSuccess(null);
              setGlobalError(null);
              void invalidateAdminData();
            }}
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

      {globalError !== null && (
        <div className="mb-4">
          <FormAlert
            variant="warning"
            title={t("authV2.admin.reauthTitle")}
            code={errorSupportCode(globalError)}
          >
            <div className="space-y-2">
              <p>{t("authV2.admin.reauthText")}</p>
              <Button size="sm" onClick={() => setStepUpOpen(true)}>
                {t("authV2.admin.reauthButton")}
              </Button>
            </div>
          </FormAlert>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: t("authV2.admin.stats.total"),
            value: users.length,
            icon: UsersRound,
          },
          {
            label: t("authV2.admin.stats.active"),
            value: activeCount,
            icon: ShieldCheck,
          },
          {
            label: t("authV2.admin.stats.inactive"),
            value: users.length - activeCount,
            icon: Ban,
          },
          {
            label: t("authV2.admin.stats.mfaRequired"),
            value: mfaCount,
            icon: Fingerprint,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-base-300 bg-base-100 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-base-content/55">{label}</p>
              <Icon size={16} className="text-primary" />
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <PageSection
        icon={<UsersRound size={18} />}
        title={t("authV2.admin.usersTitle")}
        description={t("authV2.admin.usersText")}
      >
        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_11rem_11rem]">
          <label className="relative flex items-center">
            <span className="pointer-events-none absolute start-3 text-base-content/45">
              <Search size={16} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("authV2.admin.searchPlaceholder")}
              aria-label={t("authV2.admin.searchPlaceholder")}
              className="input input-bordered h-10 w-full rounded-xl bg-base-100 ps-9"
            />
          </label>
          <Select
            label={t("authV2.admin.roleFilter")}
            options={roleOptions}
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="h-10 min-h-10"
          />
          <Select
            label={t("authV2.admin.statusFilter")}
            options={statusOptions}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 min-h-10"
          />
        </div>

        {usersQuery.isError ? (
          <FormAlert code={errorSupportCode(usersQuery.error)}>
            {t(errorMessageKey(usersQuery.error))}
          </FormAlert>
        ) : usersQuery.isPending ? (
          <div className="space-y-2" role="status" aria-live="polite">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-xl bg-base-200"
              />
            ))}
            <span className="sr-only">{t("authV2.common.loading")}</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-sm text-base-content/55">
            {t("authV2.admin.noResults")}
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>{t("authV2.admin.table.user")}</th>
                    <th>{t("authV2.admin.table.role")}</th>
                    <th>{t("authV2.admin.table.status")}</th>
                    <th>{t("authV2.admin.table.mfa")}</th>
                    <th>{t("authV2.admin.table.created")}</th>
                    <th className="text-end">
                      {t("authV2.admin.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((candidate) => {
                    const isSelf = candidate.id === user.id;
                    const manageable = canManageTargetRole(
                      actorRole,
                      candidate.role,
                    );
                    return (
                      <tr key={candidate.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
                              {initials(candidate.name, candidate.email)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {candidate.name}
                                {isSelf && (
                                  <span className="ms-1.5 text-[10px] text-base-content/45">
                                    ({t("authV2.admin.self")})
                                  </span>
                                )}
                              </p>
                              <p
                                dir="ltr"
                                className="truncate text-[11px] text-base-content/50"
                              >
                                {candidate.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <RoleBadge role={candidate.role} />
                        </td>
                        <td>
                          <Badge
                            variant={candidate.isActive ? "success" : "neutral"}
                            outline
                          >
                            {candidate.isActive
                              ? t("authV2.common.active")
                              : t("authV2.common.inactive")}
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            variant={
                              candidate.twoFactorRequired ? "warning" : "neutral"
                            }
                            outline
                          >
                            {candidate.twoFactorRequired
                              ? t("authV2.common.required")
                              : t("authV2.common.optional")}
                          </Badge>
                        </td>
                        <td className="text-xs text-base-content/55">
                          {formatDate(candidate.createdAt, locale)}
                        </td>
                        <td>
                          <div className="flex justify-end gap-1">
                            {manageable && !isSelf ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-square btn-xs"
                                  onClick={() => openEdit(candidate)}
                                  aria-label={t("authV2.admin.edit")}
                                  title={t("authV2.admin.edit")}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-square btn-xs"
                                  onClick={() => {
                                    setSuccess(null);
                                    setMfaError(null);
                                    setMfaTarget(candidate);
                                  }}
                                  aria-label={t("authV2.admin.mfaAction")}
                                  title={t("authV2.admin.mfaAction")}
                                >
                                  <Fingerprint size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-square btn-xs text-error"
                                  onClick={() => {
                                    setSuccess(null);
                                    setRevokeError(null);
                                    setRevokeTarget(candidate);
                                  }}
                                  aria-label={t("authV2.admin.revokeSessions")}
                                  title={t("authV2.admin.revokeSessions")}
                                >
                                  <Ban size={14} />
                                </button>
                              </>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] text-base-content/40"
                                title={t("authV2.admin.noAccess")}
                              >
                                <Lock size={13} />
                                {isSelf
                                  ? t("authV2.admin.self")
                                  : t("authV2.admin.protected")}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="space-y-2 lg:hidden">
              {filteredUsers.map((candidate) => {
                const isSelf = candidate.id === user.id;
                const manageable = canManageTargetRole(actorRole, candidate.role);
                return (
                  <li
                    key={candidate.id}
                    className="rounded-2xl border border-base-300 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
                          {initials(candidate.name, candidate.email)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {candidate.name}
                            {isSelf && (
                              <span className="ms-1.5 text-[10px] text-base-content/45">
                                ({t("authV2.admin.self")})
                              </span>
                            )}
                          </p>
                          <p
                            dir="ltr"
                            className="truncate text-[11px] text-base-content/50"
                          >
                            {candidate.email}
                          </p>
                        </div>
                      </div>
                      <RoleBadge role={candidate.role} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant={candidate.isActive ? "success" : "neutral"}
                        outline
                      >
                        {candidate.isActive
                          ? t("authV2.common.active")
                          : t("authV2.common.inactive")}
                      </Badge>
                      <Badge
                        variant={
                          candidate.twoFactorRequired ? "warning" : "neutral"
                        }
                        outline
                      >
                        {candidate.twoFactorRequired
                          ? t("authV2.common.required")
                          : t("authV2.common.optional")}
                      </Badge>
                    </div>
                    <div className="mt-2 flex justify-end gap-1">
                      {manageable && !isSelf ? (
                        <>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => openEdit(candidate)}
                          >
                            <Pencil size={13} />
                            {t("authV2.admin.edit")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              setSuccess(null);
                              setMfaError(null);
                              setMfaTarget(candidate);
                            }}
                          >
                            <Fingerprint size={13} />
                            {t("authV2.admin.mfaAction")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-error"
                            onClick={() => {
                              setSuccess(null);
                              setRevokeError(null);
                              setRevokeTarget(candidate);
                            }}
                          >
                            <Ban size={13} />
                            {t("authV2.admin.revokeSessions")}
                          </Button>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-base-content/40">
                          <Lock size={12} />
                          {isSelf
                            ? t("authV2.admin.self")
                            : t("authV2.admin.protected")}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </PageSection>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <PageSection
          icon={<UserPlus size={18} />}
          title={t("authV2.admin.inviteTitle")}
          description={t("authV2.admin.inviteText")}
        >
          <form
            className="space-y-3"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void submitInvitation();
            }}
          >
            {inviteSuccess && (
              <FormAlert
                variant={inviteSuccess.delivery === "outbox" ? "warning" : "success"}
              >
                {inviteSuccess.delivery === "outbox"
                  ? t("authV2.admin.inviteSuccessOutbox", {
                      email: inviteSuccess.email,
                    })
                  : t("authV2.admin.inviteSuccessEmail", {
                      email: inviteSuccess.email,
                    })}
                <span className="mt-1 block opacity-80">
                  {t("authV2.admin.inviteLinkUnavailable")}
                </span>
              </FormAlert>
            )}
            {inviteError !== null && (
              <FormAlert code={errorSupportCode(inviteError)}>
                {t(errorMessageKey(inviteError))}
              </FormAlert>
            )}

            <TextField
              label={t("authV2.admin.inviteEmail")}
              value={inviteEmail}
              onChange={(value) => {
                setInviteEmail(value);
                if (inviteEmailError) setInviteEmailError(null);
              }}
              type="email"
              autoComplete="email"
              placeholder={t("authV2.admin.inviteEmailPlaceholder")}
              error={inviteEmailError ?? undefined}
              leadingIcon={<Mail size={16} />}
              dir="ltr"
              required
              disabled={inviting}
            />
            <Select
              label={t("authV2.admin.inviteRole")}
              options={assignableOptions}
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value)}
              disabled={inviting}
            />
            <Button type="submit" loading={inviting} className="rounded-xl">
              <UserPlus size={15} />
              {inviting ? t("authV2.admin.inviting") : t("authV2.admin.inviteSubmit")}
            </Button>
          </form>
        </PageSection>

        <PageSection
          icon={<Mail size={18} />}
          title={t("authV2.admin.invitationsTitle")}
          description={t("authV2.admin.invitationsText")}
        >
          {invitationsQuery.isError ? (
            <FormAlert code={errorSupportCode(invitationsQuery.error)}>
              {t(errorMessageKey(invitationsQuery.error))}
            </FormAlert>
          ) : invitationsQuery.isPending ? (
            <p className="text-sm text-base-content/55">
              {t("authV2.common.loading")}
            </p>
          ) : invitations.length === 0 ? (
            <p className="text-sm text-base-content/55">
              {t("authV2.admin.invitationsEmpty")}
            </p>
          ) : (
            <ul className="divide-y divide-base-300">
              {invitations.map((invitation) => {
                const status = invitationStatus(invitation);
                return (
                  <li
                    key={invitation.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p
                        dir="ltr"
                        className="truncate text-sm font-medium"
                      >
                        {invitation.email}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-base-content/55">
                        <RoleBadge role={invitation.role} />
                        <Badge
                          variant={
                            status === "pending"
                              ? "info"
                              : status === "accepted"
                                ? "success"
                                : "neutral"
                          }
                          outline
                        >
                          {t(`authV2.admin.invitationStatus.${status}`)}
                        </Badge>
                        <span>
                          {t("authV2.admin.invitationExpires")}:{" "}
                          {formatDate(invitation.expiresAt, locale)}
                        </span>
                      </div>
                    </div>
                    {status === "pending" && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="self-end text-error sm:self-auto"
                        onClick={() => {
                          setSuccess(null);
                          setInvitationError(null);
                          setInvitationTarget(invitation);
                        }}
                      >
                        <Ban size={13} />
                        {t("authV2.admin.revokeInvitation")}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </PageSection>
      </div>

      {actorRole === "OWNER" && (
        <div className="mt-6">
          <PageSection
            icon={<Crown size={18} />}
            title={t("authV2.admin.ownerTransferTitle")}
            description={t("authV2.admin.ownerTransferText")}
            tone="danger"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <Select
                  label={t("authV2.admin.ownerTransferTarget")}
                  options={ownerCandidates.map((candidate) => ({
                    value: candidate.id,
                    label: `${candidate.name} · ${candidate.email}`,
                  }))}
                  placeholder={t("authV2.admin.ownerTransferSelect")}
                  value={ownerTargetId}
                  onChange={(event) => setOwnerTargetId(event.target.value)}
                />
              </div>
              <Button
                variant="error"
                disabled={!ownerTargetId}
                onClick={() => {
                  setOwnerError(null);
                  setOwnerConfirmEmail("");
                  setOwnerOpen(true);
                }}
              >
                <Crown size={15} />
                {t("authV2.admin.ownerTransferButton")}
              </Button>
            </div>
            <p className="mt-3 rounded-2xl border border-error/30 bg-error/10 p-3 text-xs leading-relaxed text-error">
              {t("authV2.admin.ownerTransferWarning")}
            </p>
          </PageSection>
        </div>
      )}

      <Modal
        open={editTarget !== null}
        onClose={() => {
          if (!savingEdit) setEditTarget(null);
        }}
        labelledBy={editTitleId}
        closeDisabled={savingEdit}
      >
        <h2 id={editTitleId} className="text-lg font-bold">
          {t("authV2.admin.editTitle")}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-base-content/65">
          {t("authV2.admin.editText")}
        </p>

        {editTarget && (
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void saveEdit();
            }}
          >
            {editError !== null && (
              <FormAlert code={errorSupportCode(editError)}>
                {t(errorMessageKey(editError))}
              </FormAlert>
            )}

            <div className="rounded-2xl border border-base-300 bg-base-200/40 p-3 text-sm">
              <p className="font-medium">{editTarget.name}</p>
              <p dir="ltr" className="text-xs text-base-content/55">
                {editTarget.email}
              </p>
            </div>

            <Select
              label={t("authV2.admin.roleLabel")}
              options={assignableOptions.filter((option) =>
                ROLE_VALUES.has(option.value),
              )}
              value={editRole}
              onChange={(event) => setEditRole(event.target.value)}
              disabled={savingEdit || editTarget.id === user.id}
            />

            <Checkbox
              id="auth-v2-edit-active"
              label={t("authV2.admin.activeLabel")}
              checked={editActive}
              onChange={(event) => setEditActive(event.target.checked)}
              disabled={savingEdit || editTarget.id === user.id}
            />

            <p className="text-xs leading-relaxed text-warning">
              {t("authV2.admin.editWarning")}
            </p>

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setEditTarget(null)}
                disabled={savingEdit}
              >
                {t("authV2.common.cancel")}
              </Button>
              <Button type="submit" loading={savingEdit}>
                {t("authV2.admin.save")}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={mfaTarget !== null}
        title={
          mfaTarget?.twoFactorRequired
            ? t("authV2.admin.removeMfaTitle")
            : t("authV2.admin.requireMfaTitle")
        }
        description={
          mfaTarget?.twoFactorRequired
            ? t("authV2.admin.removeMfaText")
            : t("authV2.admin.requireMfaText")
        }
        confirmLabel={
          mfaTarget?.twoFactorRequired
            ? t("authV2.admin.removeMfa")
            : t("authV2.admin.requireMfa")
        }
        variant={mfaTarget?.twoFactorRequired ? "warning" : "primary"}
        busy={savingMfa}
        onClose={() => {
          if (!savingMfa) setMfaTarget(null);
        }}
        onConfirm={() => void saveMfa()}
      >
        {mfaError !== null && (
          <FormAlert code={errorSupportCode(mfaError)}>
            {t(errorMessageKey(mfaError))}
          </FormAlert>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={revokeTarget !== null}
        title={t("authV2.admin.revokeSessionsTitle")}
        description={t("authV2.admin.revokeSessionsText")}
        confirmLabel={t("authV2.admin.revokeSessionsConfirm")}
        busy={revokingSessions}
        onClose={() => {
          if (!revokingSessions) setRevokeTarget(null);
        }}
        onConfirm={() => void revokeUserSessions()}
      >
        {revokeError !== null && (
          <FormAlert code={errorSupportCode(revokeError)}>
            {t(errorMessageKey(revokeError))}
          </FormAlert>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={invitationTarget !== null}
        title={t("authV2.admin.revokeInvitationTitle")}
        description={t("authV2.admin.revokeInvitationText")}
        confirmLabel={t("authV2.admin.revokeInvitation")}
        busy={revokingInvitation}
        onClose={() => {
          if (!revokingInvitation) setInvitationTarget(null);
        }}
        onConfirm={() => void revokeInvitation()}
      >
        {invitationError !== null && (
          <FormAlert code={errorSupportCode(invitationError)}>
            {t(errorMessageKey(invitationError))}
          </FormAlert>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={ownerOpen}
        title={t("authV2.admin.ownerTransferConfirmTitle")}
        description={t("authV2.admin.ownerTransferConfirmText")}
        confirmLabel={t("authV2.admin.ownerTransferButton")}
        busy={transferring}
        confirmDisabled={
          !ownerTarget ||
          ownerConfirmEmail.trim().toLowerCase() !==
            (ownerTarget?.email ?? "").toLowerCase()
        }
        onClose={() => {
          if (!transferring) setOwnerOpen(false);
        }}
        onConfirm={() => void transferOwner()}
      >
        {ownerError !== null && (
          <div className="mb-3">
            <FormAlert code={errorSupportCode(ownerError)}>
              {t(errorMessageKey(ownerError))}
            </FormAlert>
          </div>
        )}
        <TextField
          label={t("authV2.admin.ownerTransferConfirmLabel")}
          value={ownerConfirmEmail}
          onChange={setOwnerConfirmEmail}
          placeholder={ownerTarget?.email ?? ""}
          hint={t("authV2.admin.ownerTransferConfirmHint", {
            email: ownerTarget?.email ?? "",
          })}
          dir="ltr"
          autoComplete="off"
          disabled={transferring}
        />
      </ConfirmDialog>

      <StepUpDialog
        open={stepUpOpen}
        onClose={() => setStepUpOpen(false)}
        onVerified={() => {
          setGlobalError(null);
          setSuccess(t("authV2.admin.reauthSuccess"));
        }}
      />
    </div>
  );
}
