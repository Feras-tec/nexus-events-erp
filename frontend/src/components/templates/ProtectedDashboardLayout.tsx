import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/react";
import { DashboardLayout } from "./DashboardLayout";

type ProtectedDashboardLayoutProps = {
  children: ReactNode;
};

export function ProtectedDashboardLayout({
  children,
}: ProtectedDashboardLayoutProps) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <span
          className="loading loading-spinner loading-lg"
          aria-label="Anmeldung wird geprüft"
        />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
