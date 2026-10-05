import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

type UseDeactivateProductParams = {
  productId: string;
  onSuccess?: () => void;
};

export function useDeactivateProduct({
  productId,
  onSuccess,
}: UseDeactivateProductParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const deactivateProductMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/products/${productId}/deactivate`,
        token,
        {
          method: "PATCH",
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["products", productId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["products"],
        }),
      ]);

      onSuccess?.();
    },
  });

  return {
    deactivateProductMutation,
  };
}
