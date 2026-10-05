import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { EquipmentResponse } from "../types/equipment.types";

export function useEquipmentDetail(equipmentId: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["equipment", equipmentId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/inventory-items/${equipmentId}`,
        token,
      );

      if (!response.ok) {
        throw new Error("Gerät konnte nicht geladen werden.");
      }

      const result = (await response.json()) as EquipmentResponse;

      return result.data;
    },
  });
}
