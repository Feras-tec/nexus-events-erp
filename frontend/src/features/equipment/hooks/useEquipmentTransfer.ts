import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { EquipmentDetail } from "../types/equipment.types";

type UseEquipmentTransferParams = {
  equipmentId: string;
  equipment?: EquipmentDetail;
};

export function useEquipmentTransfer({
  equipmentId,
  equipment,
}: UseEquipmentTransferParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const transferWarehouseMutation = useMutation({
    mutationFn: async (toWarehouseId: string) => {
      if (!equipment) {
        throw new Error("Gerät wurde nicht gefunden.");
      }

      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type: "TRANSFERRED",
            toStatus: equipment.status,
            toWarehouseId,
            notes: "Gerät wurde in ein anderes Lager übertragen",
          }),
        },
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        throw new Error(
          result?.error ?? "Lagertransfer fehlgeschlagen.",
        );
      }

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["equipment", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment-movements", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["warehouses"],
        }),
      ]);
    },
  });

  return {
    transferWarehouseMutation,
  };
}
