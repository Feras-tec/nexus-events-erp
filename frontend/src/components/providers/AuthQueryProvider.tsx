import { useAuth } from "@clerk/react";
import type { ReactNode } from "react";
import { SessionQueryBoundary } from "./SessionQueryBoundary";

export function AuthQueryProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, sessionId } = useAuth();

  // Clerk steuert die Cache-Lebensdauer unabhängig von der aktuell geöffneten Route.
  return (
    <SessionQueryBoundary
      isLoaded={isLoaded}
      isSignedIn={isSignedIn}
      userId={userId}
      sessionId={sessionId}
    >
      {children}
    </SessionQueryBoundary>
  );
}
