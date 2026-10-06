import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import type { ProductTableItem } from "../../../components/organisms/ProductTable";
import { apiFetch } from "../../../services/api";

type ProductsResponse = {
  data: ProductTableItem[];
};

export function useProducts() {
  const { getToken } = useAuth();

  const query = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        "/api/products",
        token,
      );

      const result =
        (await response.json()) as ProductsResponse;

      return result.data;
    },
  });

  return {
    products: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
