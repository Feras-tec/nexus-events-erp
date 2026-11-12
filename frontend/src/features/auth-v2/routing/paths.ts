/**
 * Isolated auth-v2 paths. Nothing here is mounted in `src/router.tsx` during
 * Phase 2E; the integration phase maps these paths onto the existing router.
 */
export const AUTH_V2_PATHS = {
  root: "/auth-v2",
  signIn: "/auth-v2/sign-in",
  twoFactor: "/auth-v2/two-factor",
  mfaEnroll: "/auth-v2/mfa/enroll",
  forgotPassword: "/auth-v2/forgot-password",
  resetPassword: "/auth-v2/reset-password",
  firstPassword: "/auth-v2/first-password",
  acceptInvitation: "/auth-v2/accept-invitation",
  security: "/auth-v2/account/security",
  sessions: "/auth-v2/account/sessions",
  employees: "/auth-v2/admin/employees",
  sessionExpired: "/auth-v2/session-expired",
  signedOut: "/auth-v2/signed-out",
} as const;

export type AuthV2RouteName =
  | "root"
  | "sign-in"
  | "two-factor"
  | "mfa-enroll"
  | "forgot-password"
  | "first-password"
  | "reset-password"
  | "accept-invitation"
  | "security"
  | "sessions"
  | "employees"
  | "session-expired"
  | "signed-out"
  | "not-found";

export type AuthV2RouteMatch = {
  name: AuthV2RouteName;
  params: Record<string, string>;
};

export function resetPasswordPath(token?: string): string {
  return token
    ? `${AUTH_V2_PATHS.resetPassword}/${encodeURIComponent(token)}`
    : AUTH_V2_PATHS.resetPassword;
}

export function acceptInvitationPath(token?: string): string {
  return token
    ? `${AUTH_V2_PATHS.acceptInvitation}?token=${encodeURIComponent(token)}`
    : AUTH_V2_PATHS.acceptInvitation;
}

export function signInPath(returnTo?: string): string {
  return returnTo
    ? `${AUTH_V2_PATHS.signIn}?returnTo=${encodeURIComponent(returnTo)}`
    : AUTH_V2_PATHS.signIn;
}

export function matchAuthV2Route(pathname: string): AuthV2RouteMatch {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  switch (normalized) {
    case AUTH_V2_PATHS.root:
    case "/auth-v2.html":
      return { name: "root", params: {} };
    case AUTH_V2_PATHS.signIn:
      return { name: "sign-in", params: {} };
    case AUTH_V2_PATHS.twoFactor:
      return { name: "two-factor", params: {} };
    case AUTH_V2_PATHS.mfaEnroll:
      return { name: "mfa-enroll", params: {} };
    case AUTH_V2_PATHS.forgotPassword:
      return { name: "forgot-password", params: {} };
    case AUTH_V2_PATHS.firstPassword:
      return { name: "first-password", params: {} };
    case AUTH_V2_PATHS.resetPassword:
      return { name: "reset-password", params: {} };
    case AUTH_V2_PATHS.acceptInvitation:
      return { name: "accept-invitation", params: {} };
    case AUTH_V2_PATHS.security:
      return { name: "security", params: {} };
    case AUTH_V2_PATHS.sessions:
      return { name: "sessions", params: {} };
    case AUTH_V2_PATHS.employees:
      return { name: "employees", params: {} };
    case AUTH_V2_PATHS.sessionExpired:
      return { name: "session-expired", params: {} };
    case AUTH_V2_PATHS.signedOut:
      return { name: "signed-out", params: {} };
    default:
      break;
  }

  const resetPrefix = `${AUTH_V2_PATHS.resetPassword}/`;
  if (normalized.startsWith(resetPrefix)) {
    const token = normalized.slice(resetPrefix.length);
    if (token.length > 0) {
      return { name: "reset-password", params: { token: decodeURIComponent(token) } };
    }
  }

  return { name: "not-found", params: {} };
}
