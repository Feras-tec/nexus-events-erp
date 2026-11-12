import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  MonitorSmartphone,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { can } from "../../features/auth/permissions";
import {
  USER_ADMINISTRATION_PATHS,
  type UserAdministrationSection,
} from "../../features/auth-v2/routing/sections";
import { useAppUser } from "../../features/users/context/AppUserContext";

type UserAdministrationTab = {
  section: UserAdministrationSection;
  icon: LucideIcon;
  /** The employee-account tab is restricted to roles that may read /users. */
  requiresUserManagement?: boolean;
};

const tabs: UserAdministrationTab[] = [
  {
    section: "security",
    icon: ShieldCheck,
  },
  {
    section: "sessions",
    icon: MonitorSmartphone,
  },
  {
    section: "employees",
    icon: UsersRound,
    requiresUserManagement: true,
  },
];

export function UserAdministrationTabs() {
  const { t } = useTranslation();
  const currentUser = useAppUser();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  // Preserve the existing role-based access control: only roles that can read
  // /users see the employee-account tab. Personal security/session pages stay
  // available to every authenticated role.
  const visibleTabs = tabs.filter(
    (tab) =>
      !tab.requiresUserManagement || can(currentUser?.role, "users"),
  );

  return (
    <div className="min-w-0 border-b border-base-300 bg-base-100/90 backdrop-blur-xl">
      <nav
        aria-label={t("authV2.nav.label")}
        className="w-full min-w-0 overflow-x-auto overscroll-x-contain px-3 sm:px-6"
      >
        <ul className="flex min-w-max items-stretch gap-1">
          {visibleTabs.map(({ section, icon: Icon }) => {
            const to = USER_ADMINISTRATION_PATHS[section];
            const active =
              pathname === to || pathname.startsWith(`${to}/`);

            return (
              <li key={section} className="flex">
                <Link
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "group relative flex min-h-12 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-semibold transition-colors sm:px-4",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-base-content/60 hover:border-base-300 hover:text-base-content",
                  ].join(" ")}
                >
                  <Icon
                    size={17}
                    strokeWidth={active ? 2.2 : 1.8}
                    aria-hidden="true"
                    className="shrink-0"
                  />
                  <span>{t(`authV2.nav.${section}`)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
