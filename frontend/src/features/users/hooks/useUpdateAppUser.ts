import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../../services/api";

type UpdateUserInput = {
  id: string;
  role?: string;
  isActive?: boolean;
};

export function useUpdateAppUser() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...changes }: UpdateUserInput) => {
      const token = await getToken();
      if (!token) throw new Error("Missing authentication token");

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
