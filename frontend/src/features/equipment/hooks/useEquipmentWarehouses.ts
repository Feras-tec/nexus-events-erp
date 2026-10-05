import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { WarehousesResponse } from "../types/equipment.types";

export function useEquipmentWarehouses() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiFetch("/api/warehouses", token);

      if (!response.ok) {
        throw new Error("Lager konnten nicht geladen werden.");
      }

      const result = (await response.json()) as WarehousesResponse;

      return result.data;
    },
  });
}
