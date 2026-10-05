import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ProductFormValues } from "../../../components/organisms/ProductForm";
import { apiFetch } from "../../../services/api";

type UseUpdateProductParams = {
  productId: string;
  onSuccess?: () => void;
};

export function useUpdateProduct({
  productId,
  onSuccess,
}: UseUpdateProductParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const token = await getToken();

      const payload = {
        name: data.name.trim(),
        brand: data.brand.trim() || undefined,
        model: data.model.trim() || undefined,
        category: data.category.trim() || undefined,
        description: data.description.trim() || undefined,
        trackingType: data.trackingType,
        usageType: data.usageType,
      };

      const response = await apiFetch(
        `/api/products/${productId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
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
    updateProductMutation,
  };
}
