import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ProductFormValues } from "../../../components/organisms/ProductForm";
import { apiFetch } from "../../../services/api";

type UseCreateProductParams = {
  onSuccess?: () => void;
};

export function useCreateProduct({
  onSuccess,
}: UseCreateProductParams = {}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const token = await getToken();

      const payload = {
        productNo: data.productNo.trim(),
        name: data.name.trim(),
        brand: data.brand.trim() || undefined,
        model: data.model.trim() || undefined,
        category: data.category.trim() || undefined,
        description: data.description.trim() || undefined,
        trackingType: data.trackingType,
        usageType: data.usageType,
      };

      const response = await apiFetch(
        "/api/products",
        token,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["products"],
      });

      onSuccess?.();
    },
  });

  return {
    createProductMutation,
  };
}
