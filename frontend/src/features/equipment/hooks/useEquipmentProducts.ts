import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { ProductsResponse } from "../types/equipment.types";

export function useEquipmentProducts() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiFetch("/api/products", token);

      if (!response.ok) {
        throw new Error("Produkte konnten nicht geladen werden.");
      }

      const result = (await response.json()) as ProductsResponse;

      return result.data;
    },
  });
}
