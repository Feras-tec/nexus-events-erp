/**
 * Routes that belong to the Auth-V2 user administration section inside the ERP
 * dashboard. They share one sidebar entry ("Benutzerverwaltung") and one
 * horizontal tab bar, but remain separate pages.
 */
export const USER_ADMINISTRATION_PATHS = {
  employees: "/users",
  security: "/account/security",
  sessions: "/account/sessions",
} as const;

export type UserAdministrationSection = keyof typeof USER_ADMINISTRATION_PATHS;

export function isUserAdministrationPath(pathname: string): boolean {
  return Object.values(USER_ADMINISTRATION_PATHS).some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
