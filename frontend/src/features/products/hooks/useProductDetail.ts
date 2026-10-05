import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { ProductResponse } from "../types/product.types";

export function useProductDetail(productId: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["products", productId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/products/${productId}`,
        token,
      );

      const result = (await response.json()) as ProductResponse;

      return result.data;
    },
  });
}
