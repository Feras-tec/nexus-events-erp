import { lazy, Suspense, useMemo, type ReactNode } from "react";
import { AppAuthContext, type AppAuthState } from "./auth-context";
import { APP_AUTH_MODE, type AppAuthMode } from "./mode";
import { AuthModeGate } from "./AuthModeGate";
import { AuthV2Provider, useAuthV2 } from "../auth-v2/context/AuthV2Provider";
import { AuthV2NavigationProvider, useAuthV2Navigation } from "../auth-v2/context/navigation";
export { useAppAuth, type AppAuthState } from "./auth-context";
export type { AppAuthMode } from "./mode";
// Clerk-Code erst für den ausdrücklich ausgewählten Rückfallmodus laden.
const ClerkAuthProvider = lazy(() => import("./ClerkAuthProvider"));
function AuthV2Bridge({ children }: { children: ReactNode }) {
  const auth = useAuthV2();
  const { logout } = useAuthV2();
  const navigation = useAuthV2Navigation();

  const value = useMemo<AppAuthState>(
    () => ({
      mode: "auth-v2",
      isLoaded: auth.status !== "loading",
      isAuthenticated: auth.status === "authenticated",
      userId: auth.user?.id ?? null,
      getToken: async () => null,
      logout: async () => {
        await logout();
        navigation.navigate("/auth-v2/sign-in", { replace: true });
      },
      user: auth.user
        ? {
            id: auth.user.id,
            name: auth.user.name,
            email: auth.user.email,
            role: auth.user.role,
            isActive: auth.user.isActive,
          }
        : null,
      authV2Status: auth.status,
      authV2Reason: auth.reason,
    }),
    [auth.status, auth.user, auth.reason, logout, navigation],
  );

  return (
    <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>
  );
}

export function AppAuthProvider({
  children,
  mode,
}: {
  children: ReactNode;
  mode?: AppAuthMode;
}) {
  const resolvedMode = mode ?? APP_AUTH_MODE;

  if (resolvedMode === "auth-v2") {
    return (
      <AuthModeGate mode={resolvedMode}><AuthV2NavigationProvider>
        <AuthV2Provider>
          <AuthV2Bridge>{children}</AuthV2Bridge>
        </AuthV2Provider>
      </AuthV2NavigationProvider></AuthModeGate>
    );
  }

  return <AuthModeGate mode={resolvedMode}><Suspense fallback={<p role="status">Loading authentication…</p>}><ClerkAuthProvider>{children}</ClerkAuthProvider></Suspense></AuthModeGate>;
}
