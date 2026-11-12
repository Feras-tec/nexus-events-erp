import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  LogOut,
  MonitorSmartphone,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { Button } from "../../../components/atoms/Button";
import { AuthCard } from "../components/AuthCard";
import { AuthHeading } from "../components/AuthHeading";
import { AuthLanguageSwitcher } from "../components/AuthLanguageSwitcher";
import { AuthLoading } from "../components/AuthLoading";
import { AuthShell } from "../components/AuthShell";
import { AuthThemeToggle } from "../components/AuthThemeToggle";
import { FormAlert } from "../components/FormAlert";
import { NexusMark } from "../components/NexusMark";
import { RoleBadge } from "../components/RoleBadge";
import {
  canManageEmployees,
  useAuthV2,
} from "../context/AuthV2Provider";
import {
  AuthV2Link,
  useAuthV2Navigation,
} from "../context/navigation";
import { errorMessageKey, errorSupportCode } from "../lib/errors";
import { initials } from "../lib/format";
import { useDocumentDirection } from "../lib/useDocumentDirection";
import { AUTH_V2_PATHS, signInPath } from "../routing/paths";
import { SessionExpiredPage } from "../pages/SessionExpiredPage";

type NavItem = {
  to: string;
  label: string;
  icon: typeof ShieldCheck;
};

export function ProtectedAuthLayout({
  children,
  allowMfaEnrollment = false,
}: {
  children: ReactNode;
  allowMfaEnrollment?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { status, user, session, reason, error, refresh, logout } = useAuthV2();
  const { location, navigate } = useAuthV2Navigation();
  const isRTL = useDocumentDirection();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (status === "anonymous") {
      navigate(signInPath(location.pathname), { replace: true });
    }
  }, [location.pathname, navigate, status]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      navigate(`${AUTH_V2_PATHS.signedOut}?reason=logout`, { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  if (status === "expired") {
    return <SessionExpiredPage reason={reason ?? undefined} />;
  }

  if (status === "loading" || status === "anonymous") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <AuthLoading />
      </div>
    );
  }

  if (status === "error") {
    return (
      <AuthShell>
        <AuthCard>
          <AuthHeading
            eyebrow={t("authV2.common.secureArea")}
            title={t("authV2.common.unavailableTitle")}
            description={t("authV2.common.unavailableText")}
          />
          <FormAlert code={errorSupportCode(error)}>
            {t(errorMessageKey(error))}
          </FormAlert>
          <div className="mt-5 space-y-2">
            <Button className="w-full rounded-xl" onClick={() => void refresh()}>
              {t("authV2.common.retry")}
            </Button>
            <Button
              variant="ghost"
              className="w-full rounded-xl"
              loading={loggingOut}
              onClick={() => void handleLogout()}
            >
              {t("authV2.common.signOut")}
            </Button>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  if (status === "mfa-enrollment-required") {
    if (allowMfaEnrollment) return <>{children}</>;

    return (
      <AuthShell>
        <AuthCard>
          <AuthHeading
            eyebrow={t("authV2.mfa.eyebrow")}
            title={t("authV2.mfa.requiredBannerTitle")}
            description={t("authV2.mfa.requiredBannerText")}
          />
          <FormAlert variant="warning">
            {t("authV2.mfa.requiredNote")}
          </FormAlert>
          <div className="mt-5 space-y-2">
            <AuthV2Link
              to={AUTH_V2_PATHS.mfaEnroll}
              className="btn btn-primary w-full rounded-xl"
            >
              {t("authV2.mfa.start")}
            </AuthV2Link>
            <Button
              variant="ghost"
              className="w-full rounded-xl"
              loading={loggingOut}
              onClick={() => void handleLogout()}
            >
              {t("authV2.common.signOut")}
            </Button>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  if (!user || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <AuthLoading />
      </div>
    );
  }

  const navItems: NavItem[] = [
    {
      to: AUTH_V2_PATHS.security,
      label: t("authV2.nav.security"),
      icon: ShieldCheck,
    },
    {
      to: AUTH_V2_PATHS.sessions,
      label: t("authV2.nav.sessions"),
      icon: MonitorSmartphone,
    },
    ...(canManageEmployees(user.role)
      ? [
          {
            to: AUTH_V2_PATHS.employees,
            label: t("authV2.nav.employees"),
            icon: UsersRound,
          },
        ]
      : []),
  ];

  function isActive(to: string): boolean {
    return location.pathname === to;
  }

  return (
    <div
      lang={i18n.resolvedLanguage ?? i18n.language}
      dir={isRTL ? "rtl" : "ltr"}
      className="flex min-h-screen flex-col bg-base-200"
    >
      <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <AuthV2Link
            to={AUTH_V2_PATHS.security}
            className="flex min-w-0 items-center gap-2.5"
          >
            <NexusMark size="sm" />
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-sm font-bold leading-tight">
                {t("authV2.brand.product")}
              </span>
              <span className="block truncate text-[11px] text-base-content/50">
                {t("authV2.brand.management")}
              </span>
            </span>
          </AuthV2Link>

          <nav
            aria-label={t("authV2.nav.label")}
            className="ms-3 hidden items-center gap-1 lg:flex"
          >
            {navItems.map(({ to, label, icon: Icon }) => (
              <AuthV2Link
                key={to}
                to={to}
                aria-current={isActive(to) ? "page" : undefined}
                className={`btn btn-ghost btn-sm gap-1.5 rounded-xl ${
                  isActive(to) ? "bg-base-200 text-base-content" : ""
                }`}
              >
                <Icon size={16} />
                {label}
              </AuthV2Link>
            ))}
          </nav>

          <div className="ms-auto flex shrink-0 items-center gap-1.5">
            <AuthLanguageSwitcher />
            <AuthThemeToggle />
            <span className="mx-1 hidden h-8 w-px bg-base-300 sm:block" />
            <div className="hidden min-w-0 text-end md:block">
              <p className="max-w-40 truncate text-xs font-semibold">
                {user.name}
              </p>
              <p className="max-w-40 truncate text-[11px] text-base-content/50">
                {t(`authV2.roles.${user.role}`, { defaultValue: user.role })}
              </p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary"
              aria-hidden="true"
            >
              {initials(user.name, user.email)}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-circle btn-sm"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              aria-label={t("authV2.common.signOut")}
              title={t("authV2.common.signOut")}
            >
              {loggingOut ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <LogOut size={17} className={isRTL ? "rotate-180" : ""} />
              )}
            </button>
          </div>
        </div>

        <nav
          aria-label={t("authV2.nav.label")}
          className="flex gap-1 overflow-x-auto border-t border-base-300 px-3 py-2 lg:hidden"
        >
          {navItems.map(({ to, label, icon: Icon }) => (
            <AuthV2Link
              key={to}
              to={to}
              aria-current={isActive(to) ? "page" : undefined}
              className={`btn btn-ghost btn-sm shrink-0 gap-1.5 rounded-xl ${
                isActive(to) ? "bg-base-200 text-base-content" : ""
              }`}
            >
              <Icon size={16} />
              {label}
            </AuthV2Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-10">
        {children}
      </main>

      <footer className="border-t border-base-300 bg-base-100/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 text-[11px] text-base-content/45 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="inline-flex items-center gap-1.5">
            <LayoutDashboard size={13} />
            {t("authV2.shell.protectedFooter")}
          </span>
          <span className="inline-flex items-center gap-2">
            <RoleBadge role={user.role} />
            <span>{t("authV2.shell.footer")}</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
