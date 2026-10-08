import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

export type AppUser = {
  id: string;
  clerkUserId: string;
  role: string;
  isActive: boolean;
};

const AppUserContext = createContext<AppUser | null>(null);

export function AppUserProvider({
  user,
  children,
}: {
  user: AppUser;
  children: ReactNode;
}) {
  return (
    <AppUserContext.Provider value={user}>
      {children}
    </AppUserContext.Provider>
  );
}

export function useAppUser() {
  return useContext(AppUserContext);
}
