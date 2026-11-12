import { useMemo, type ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/react";
import { AuthQueryProvider } from "../../components/providers/AuthQueryProvider";
import { AppAuthContext, type AppAuthState } from "./auth-context";
function ClerkBridge({ children }: { children: ReactNode }) {
  const clerk = useAuth();

  const value = useMemo<AppAuthState>(
    () => ({
      mode: "clerk",
      isLoaded: clerk.isLoaded,
      isAuthenticated: Boolean(clerk.isSignedIn && clerk.userId),
      userId: clerk.userId ?? null,
      getToken: async () => (await clerk.getToken()) ?? null,
      logout: async () => {
        // Clerk logout is handled by its own components; this is a no-op bridge.
      },
      user: null,
    }),
    [clerk.isLoaded, clerk.isSignedIn, clerk.userId, clerk.getToken],
  );

  return (
    <AppAuthContext.Provider value={value}>
      <AuthQueryProvider>{children}</AuthQueryProvider>
    </AppAuthContext.Provider>
  );
}


export default function ClerkAuthProvider({children}:{children:ReactNode}) {
 const key=import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
 if(!key) throw new Error("Missing Clerk Publishable Key");
 return <ClerkProvider publishableKey={key}><ClerkBridge>{children}</ClerkBridge></ClerkProvider>;
}
