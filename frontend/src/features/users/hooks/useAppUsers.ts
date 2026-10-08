import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../../services/api";
import { useAppUser } from "../context/AppUserContext";

export type ManagedUser = {
  id: string;
  clerkUserId: string;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
};

type UsersResponse = {
  users: ManagedUser[];
};

export function useAppUsers() {
  const { getToken } = useAuth();
  const currentUser = useAppUser();

  return useQuery({
    queryKey: ["app-users"],
    enabled: currentUser?.role === "OWNER",
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing authentication token");

      const response = await apiFetch("/api/users", token);
      const result = (await response.json()) as UsersResponse;

      return result.users;
    },
  });
}
