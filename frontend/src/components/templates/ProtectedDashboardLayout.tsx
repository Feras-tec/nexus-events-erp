import { erpAuthRedirect } from "../../features/auth-v2/routing/erp-redirect";
import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { canAccessPath } from "../../features/auth/permissions";
import { useAppAuth } from "../../features/auth/AppAuthProvider";
import { DashboardLayout } from "./DashboardLayout";
import { apiFetch } from "../../services/api";

type Props = {
  children: ReactNode;
};

import {
  AppUserProvider,
  type AppUser,
} from "../../features/users/context/AppUserContext";

export function ProtectedDashboardLayout({ children }: Props) {
  const auth = useAppAuth();
  const { t } = useTranslation();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const [account, setAccount] = useState<{
    key: string;
    user: AppUser;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isLoaded || !auth.isAuthenticated || !auth.userId) return;

    // Auth-V2 mode exposes identity (role/active) directly from the session.
    if (auth.mode === "auth-v2" && auth.user) {
      setAccount({
        key: auth.userId,
        user: {
          id: auth.user.id,
          clerkUserId: auth.user.id,
          role: auth.user.role,
          isActive: auth.user.isActive,
        },
      });
      setError(null);
      return;
    }

    // Clerk mode loads the ERP account from /api/auth/me.
    let cancelled = false;

    async function loadUser() {
      try {
        const token = await auth.getToken();
        if (!token) throw new Error("Missing authentication token");

        const response = await apiFetch("/api/auth/me", token);
        const data = await response.json();

        if (!cancelled) {
          setAccount({
            key: auth.userId!,
            user: data.user,
          });
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Account initialization failed:", err);
          setError("Benutzerkonto konnte nicht geladen werden.");
        }
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [auth.isLoaded, auth.isAuthenticated, auth.userId, auth.mode, auth.user, auth.getToken]);

  // Ein einziger Effekt verhindert konkurrierende Weiterleitungen während des Renderns.
  useEffect(() => {
    if (auth.mode !== "auth-v2" || !auth.isLoaded) return;
    if (!auth.isAuthenticated || !auth.userId || auth.authV2Status === "mfa-enrollment-required") {
      window.location.assign(erpAuthRedirect(auth.authV2Status, auth.authV2Reason,
        window.location.pathname + window.location.search));
    }
  }, [auth.mode, auth.isLoaded, auth.isAuthenticated, auth.userId, auth.authV2Status, auth.authV2Reason]);

  if (!auth.isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!auth.isAuthenticated || !auth.userId) {
    if (auth.mode === "auth-v2") {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      );
    }
    return <Navigate to="/sign-in" replace />;
  }

  if (error) {
    return (
      <div role="alert" className="alert alert-error m-6">
        {error}
      </div>
    );
  }

  if (!account || account.key !== auth.userId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!account.user.isActive) {
    return (
      <div role="alert" className="alert alert-warning m-6">
        {t("common.pendingActivation")}
      </div>
    );
  }

  if (!canAccessPath(account.user.role, pathname)) {
    return (
      <div role="alert" className="alert alert-error m-6">
        {t("common.accessDenied")}
      </div>
    );
  }

  return (
    <AppUserProvider user={account.user}>
      <DashboardLayout>{children}</DashboardLayout>
    </AppUserProvider>
  );
}
