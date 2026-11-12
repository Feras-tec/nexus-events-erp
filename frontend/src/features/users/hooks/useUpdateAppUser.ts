import { useAppAuth } from "../../auth/AppAuthProvider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../../services/api";

type UpdateUserInput = {
  id: string;
  role?: string;
  isActive?: boolean;
};

export function useUpdateAppUser() {
  const { getToken, mode } = useAppAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...changes }: UpdateUserInput) => {
      const token = await getToken();
      // Cookie-Sitzungen benötigen kein Clerk-Bearer-Token.
      if (!token && mode !== "auth-v2") throw new Error("Missing authentication token");

      const response = await apiFetch(
        `/api/users/${encodeURIComponent(id)}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(changes),
        },
      );

      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["app-users"],
      });
    },
  });
}
