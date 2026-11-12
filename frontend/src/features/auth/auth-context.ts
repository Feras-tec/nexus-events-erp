import { createContext, useContext } from "react";
export type { AppAuthMode } from "./mode";
import type { AppAuthMode } from "./mode";

export type AppAuthState = {
  mode: AppAuthMode;
  isLoaded: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  getToken: () => Promise<string | null>;
  logout: () => Promise<void>;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  } | null;
  authV2Status?: string | null;
  authV2Reason?: string | null;
};

export const AppAuthContext = createContext<AppAuthState | null>(null);

export function useAppAuth(): AppAuthState {
  const value = useContext(AppAuthContext);
  if (!value) {
    throw new Error("AppAuthProvider is missing");
  }
  return value;
}

