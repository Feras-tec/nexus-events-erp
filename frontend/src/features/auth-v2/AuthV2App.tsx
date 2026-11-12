import { AuthModeGate } from "../auth/AuthModeGate";
import { safeReturnTo } from "./lib/validation";
import { useEffect } from "react";

import { AuthV2Provider, useAuthV2 } from "./context/AuthV2Provider";
import {
  AuthV2NavigationProvider,
  useAuthV2Location,
  useAuthV2Navigation,
  useAuthV2QueryParam,
} from "./context/navigation";
import { AUTH_V2_PATHS, matchAuthV2Route } from "./routing/paths";
import { AuthLoading } from "./components/AuthLoading";
import { ProtectedAuthLayout } from "./components/ProtectedAuthLayout";
import { AcceptInvitationPage } from "./pages/AcceptInvitationPage";
import { AccountSecurityPage } from "./pages/AccountSecurityPage";
import { EmployeeAccountsPage } from "./pages/EmployeeAccountsPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LoginPage } from "./pages/LoginPage";
import { MfaEnrollmentPage } from "./pages/MfaEnrollmentPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { SessionExpiredPage } from "./pages/SessionExpiredPage";
import { SessionsPage } from "./pages/SessionsPage";
import { SignedOutPage } from "./pages/SignedOutPage";
import { TwoFactorPage } from "./pages/TwoFactorPage";

function RootRedirect() {
  const { status, reason } = useAuthV2();
  const { navigate } = useAuthV2Navigation();
  const redirect = useAuthV2QueryParam("redirect");

  useEffect(() => {
    if (status === "authenticated") {
      navigate(safeReturnTo(redirect, AUTH_V2_PATHS.security), { replace: true });
    } else if (status === "mfa-enrollment-required") {
      navigate(AUTH_V2_PATHS.mfaEnroll, { replace: true });
    } else if (status === "expired") {
      navigate(
        `${AUTH_V2_PATHS.sessionExpired}?reason=${encodeURIComponent(
          reason ?? "UNAUTHENTICATED",
        )}`,
        { replace: true },
      );
    } else if (status !== "loading") {
      navigate(AUTH_V2_PATHS.signIn, { replace: true });
    }
  }, [navigate, reason, status, redirect]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <AuthLoading />
    </div>
  );
}

function RouteView() {
  const location = useAuthV2Location();
  const match = matchAuthV2Route(location.pathname);

  switch (match.name) {
    case "root":
      return <RootRedirect />;
    case "sign-in":
      return <LoginPage />;
    case "two-factor":
      return <TwoFactorPage />;
    case "mfa-enroll":
      return (
        <ProtectedAuthLayout allowMfaEnrollment>
          <MfaEnrollmentPage />
        </ProtectedAuthLayout>
      );
    case "forgot-password":
      return <ForgotPasswordPage />;
    case "first-password":
      return <ResetPasswordPage firstPassword />;
    case "reset-password":
      return <ResetPasswordPage token={match.params.token} />;
    case "accept-invitation":
      return <AcceptInvitationPage />;
    case "security":
      return (
        <ProtectedAuthLayout>
          <AccountSecurityPage />
        </ProtectedAuthLayout>
      );
    case "sessions":
      return (
        <ProtectedAuthLayout>
          <SessionsPage />
        </ProtectedAuthLayout>
      );
    case "employees":
      return (
        <ProtectedAuthLayout>
          <EmployeeAccountsPage />
        </ProtectedAuthLayout>
      );
    case "session-expired":
      return <SessionExpiredPage />;
    case "signed-out":
      return <SignedOutPage />;
    default:
      return <NotFoundPage />;
  }
}

/**
 * Isolated auth-v2 application. It owns its own navigation and query cache and
 * is not imported by `src/main.tsx` or `src/router.tsx` during Phase 2E.
 */
export function AuthV2App() {
  return (
    <AuthModeGate mode="auth-v2"><AuthV2NavigationProvider>
      <AuthV2Provider>
        <RouteView />
      </AuthV2Provider>
    </AuthV2NavigationProvider></AuthModeGate>
  );
}
