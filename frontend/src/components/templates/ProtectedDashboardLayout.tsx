import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/react";
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
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();

  const [account, setAccount] = useState<{
    clerkUserId: string;
    user: AppUser;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;

    let cancelled = false;

    async function loadUser() {
      try {
        const token = await getToken();
        if (!token) throw new Error("Missing authentication token");

        const response = await apiFetch("/api/auth/me", token);
        const data = await response.json();

        if (!cancelled) {
          setAccount({ clerkUserId: userId!, user: data.user });
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
  }, [isLoaded, isSignedIn, userId, getToken]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!isSignedIn || !userId) {
    return <Navigate to="/sign-in" replace />;
  }

  if (error) {
    return (
      <div role="alert" className="alert alert-error m-6">
        {error}
      </div>
    );
  }

  if (account?.clerkUserId !== userId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!account.user.isActive) {
    return (
      <div role="alert" className="alert alert-warning m-6">
        Dieses Benutzerkonto ist deaktiviert.
      </div>
    );
  }

  return (
    <AppUserProvider user={account.user}>
      <DashboardLayout>{children}</DashboardLayout>
    </AppUserProvider>
  );
}
