import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "../../lib/queryClient";

type Props = {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  userId: string | null | undefined;
  sessionId: string | null | undefined;
  children: ReactNode;
};

function SessionCache({ children }: { children: ReactNode }) {
  // Die durch den Schlüssel neu eingehängte Komponente besitzt genau einen privaten Cache.
  const [client] = useState(createQueryClient);

  useEffect(() => {
    return () => {
      // clear entfernt auch Mutationen und bricht laufende Query-Wiederholungen ab.
      // Späte Antworten oder Mutationscallbacks behalten ausschließlich die alte Instanz.
      client.clear();
    };
  }, [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export function SessionQueryBoundary({
  isLoaded, isSignedIn, userId, sessionId, children,
}: Props) {
  // Während unklarer Authentifizierung keine bisher geschützten Komponenten anzeigen.
  if (!isLoaded || isSignedIn === undefined || (isSignedIn && (!userId || !sessionId))) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading account">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  // Der Schlüssel wechselt bereits beim Rendern: Ein nachträglicher Effekt wäre zu spät.
  // Auch Router-Inhalte, Formulare und die Prüfung von /auth/me starten dadurch frisch.
  const scope = isSignedIn ? JSON.stringify([userId, sessionId]) : "signed-out";
  return <SessionCache key={scope}>{children}</SessionCache>;
}
