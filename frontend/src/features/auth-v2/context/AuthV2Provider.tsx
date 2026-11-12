import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";

import { createQueryClient } from "../../../lib/queryClient";
import { authV2Api } from "../api";
import {
  AuthV2ApiError,
  isSessionFailureCode,
  subscribeToSessionExpiry,
  subscribeToSessionPolicy,
  type SessionFailureCode,
} from "../api/client";
import { authV2QueryKeys } from "../api/queryKeys";
import type { AuthV2Session, AuthV2User } from "../api/types";

export type AuthV2Status =
  | "loading"
  | "anonymous"
  | "authenticated"
  | "mfa-enrollment-required"
  | "expired"
  | "error";

export type AuthV2ContextValue = {
  status: AuthV2Status;
  user: AuthV2User | null;
  session: AuthV2Session | null;
  /** Session failure code or MFA-related reason, for the expired screen. */
  reason: string | null;
  error: unknown;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

type LoadedState =
  | { status: "anonymous" }
  | { status: "authenticated"; user: AuthV2User; session: AuthV2Session }
  | {
      status: "mfa-enrollment-required";
      user: AuthV2User;
      session: AuthV2Session;
    }
  | { status: "expired"; reason: SessionFailureCode };

function isValidIdentity(user: AuthV2User | null | undefined): user is AuthV2User {
  return (
    !!user &&
    typeof user.id === "string" &&
    user.id.length > 0 &&
    typeof user.email === "string" &&
    user.email.length > 0 &&
    typeof user.role === "string" &&
    user.role.length > 0 &&
    user.isActive === true
  );
}

function normalizeUser(user: AuthV2User): AuthV2User {
  // Fail closed: an incomplete or inactive identity is never treated as a
  // valid authenticated user. Callers must handle the thrown error as
  // anonymous/expired instead of granting access.
  if (!isValidIdentity(user)) {
    throw new Error("INVALID_IDENTITY");
  }

  return {
    id: user.id,
    email: user.email,
    name:
      typeof user.name === "string" && user.name.length > 0
        ? user.name
        : user.email,
    role: user.role,
    isActive: true,
    twoFactorEnabled: user.twoFactorEnabled === true,
    twoFactorRequired: user.twoFactorRequired === true,
    twoFactorEnforcedAt: user.twoFactorEnforcedAt ?? null,
  };
}

async function loadAuthState(): Promise<LoadedState> {
  try {
    const me = await authV2Api.accountMe();
    return {
      status: "authenticated",
      user: normalizeUser(me.user),
      session: me.session,
    };
  } catch (error) {
    if (error instanceof AuthV2ApiError) {
      if (error.isMfaEnrollmentRequired) {
        const fallback = await authV2Api.getSession().catch(() => null);
        if (fallback?.user) {
          return {
            status: "mfa-enrollment-required",
            user: normalizeUser(fallback.user),
            session: fallback.session,
          };
        }
      }
      if (error.code === "UNAUTHENTICATED") {
        return { status: "anonymous" };
      }
      if (isSessionFailureCode(error.code)) {
        return { status: "expired", reason: error.code };
      }
    }
    throw error;
  }
}

const AuthV2Context = createContext<AuthV2ContextValue | null>(null);

function AuthV2StateProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [expiryReason, setExpiryReason] = useState<SessionFailureCode | null>(
    null,
  );

  useEffect(
    () => subscribeToSessionExpiry((reason) => setExpiryReason(reason)),
    [],
  );

  useEffect(() => subscribeToSessionPolicy(() => {
    void queryClient.invalidateQueries({ queryKey: authV2QueryKeys.me() });
  }), [queryClient]);

  const query = useQuery({
    queryKey: authV2QueryKeys.me(),
    queryFn: loadAuthState,
    retry: false,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    gcTime: 5 * 60_000,
  });

  const previousUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentUserId =
      query.data && "user" in query.data ? query.data.user.id : null;
    if (
      previousUserIdRef.current !== null &&
      previousUserIdRef.current !== currentUserId
    ) {
      // Die beobachtete Identitätsabfrage behalten; andere Kontodaten vollständig entfernen.
      void queryClient.cancelQueries({ predicate: q => !(q.queryKey[0] === "auth-v2" && q.queryKey[1] === "me") });
      queryClient.removeQueries({ predicate: q => !(q.queryKey[0] === "auth-v2" && q.queryKey[1] === "me") });
      queryClient.getMutationCache().clear();
    }
    previousUserIdRef.current = currentUserId;
  }, [query.data, queryClient]);

  const refresh = useCallback(async () => {
    setExpiryReason(null);
    await queryClient.invalidateQueries({
      queryKey: authV2QueryKeys.me(),
    });
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await authV2Api.signOut();
    } catch {
      // A missing cookie is already a successful local logout; never surface
      // the server error or retry with stale credentials.
    }
    setExpiryReason(null);
    await queryClient.cancelQueries();
    previousUserIdRef.current = null;
    queryClient.removeQueries({ predicate: q => !(q.queryKey[0] === "auth-v2" && q.queryKey[1] === "me") });
    queryClient.getMutationCache().clear();
    queryClient.setQueryData<LoadedState>(authV2QueryKeys.me(), {
      status: "anonymous",
    });
  }, [queryClient]);

  const value = useMemo<AuthV2ContextValue>(() => {
    if (expiryReason) {
      return {
        status: "expired",
        user: null,
        session: null,
        reason: expiryReason,
        error: null,
        refresh,
        logout,
      };
    }

    if (query.isPending && query.data === undefined) {
      return {
        status: "loading",
        user: null,
        session: null,
        reason: null,
        error: null,
        refresh,
        logout,
      };
    }

    if (query.isError) {
      return {
        status: "error",
        user: null,
        session: null,
        reason: null,
        error: query.error,
        refresh,
        logout,
      };
    }

    const data = query.data;
    if (!data || data.status === "anonymous") {
      return {
        status: "anonymous",
        user: null,
        session: null,
        reason: null,
        error: null,
        refresh,
        logout,
      };
    }

    if (data.status === "expired") {
      return {
        status: "expired",
        user: null,
        session: null,
        reason: data.reason,
        error: null,
        refresh,
        logout,
      };
    }

    return {
      status: data.status,
      user: data.user,
      session: data.session,
      reason: null,
      error: null,
      refresh,
      logout,
    };
  }, [expiryReason, logout, query.data, query.error, query.isError, query.isPending, refresh]);

  return <AuthV2Context.Provider value={value}>{children}</AuthV2Context.Provider>;
}

/**
 * Self-contained provider with a private QueryClient so auth-v2 state can never
 * be read from the existing Clerk session cache.
 */
export function AuthV2Provider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);

  // Der private Client wird mit dem Provider verworfen. Kein clear() im Cleanup:
  // React StrictMode führt dieses auch bei weiterhin aktiven Query-Observern aus.

  return (
    <QueryClientProvider client={client}>
      <AuthV2StateProvider>{children}</AuthV2StateProvider>
    </QueryClientProvider>
  );
}

export function useAuthV2(): AuthV2ContextValue {
  const value = useContext(AuthV2Context);
  if (!value) {
    throw new Error("AuthV2Provider is missing");
  }
  return value;
}

export function canManageEmployees(role: string | null | undefined): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/** UI-only guard. The backend remains the authorization authority. */
export function canManageTargetRole(
  actorRole: string | null | undefined,
  targetRole: string | null | undefined,
): boolean {
  if (actorRole === "OWNER") return true;
  if (actorRole === "ADMIN") {
    return targetRole !== "OWNER" && targetRole !== "ADMIN";
  }
  return false;
}
