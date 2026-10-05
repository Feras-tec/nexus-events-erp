import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

type UseActivateProductParams = {
  productId: string;
};

export function useActivateProduct({
  productId,
}: UseActivateProductParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const activateProductMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/products/${productId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({
            isActive: true,
          }),
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
    },
  });

  return {
    activateProductMutation,
  };
}
