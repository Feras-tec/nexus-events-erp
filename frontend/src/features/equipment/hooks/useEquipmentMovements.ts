import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { EquipmentMovementsResponse } from "../types/equipment.types";

export function useEquipmentMovements(equipmentId: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["equipment-movements", equipmentId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
      );

      if (!response.ok) {
        throw new Error("Bewegungshistorie konnte nicht geladen werden.");
      }

      const result =
        (await response.json()) as EquipmentMovementsResponse;

      return result.movements;
    },
  });
}
