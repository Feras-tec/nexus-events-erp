import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { EquipmentDetail } from "../types/equipment.types";

type ActiveReservation = {
  id: string;
};

type UseEquipmentLegacyRecoveryParams = {
  equipmentId: string;
  equipment?: EquipmentDetail;
  activeReservation: ActiveReservation | null;
};

export function useEquipmentLegacyRecovery({
  equipmentId,
  equipment,
  activeReservation,
}: UseEquipmentLegacyRecoveryParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const legacyPickingResetMutation = useMutation({
    mutationFn: async () => {
      if (!equipment || equipment.status !== "PICKING") {
        throw new Error("Gerät befindet sich nicht in Kommissionierung.");
      }

      if (activeReservation) {
        throw new Error(
          "Korrektur nicht erlaubt: Eine Reservierung ist bereits verknüpft.",
        );
      }

      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type: "MANUAL_ADJUSTMENT",
            toStatus: "AVAILABLE",
            toLocation: `Lagerbereich – ${equipment.warehouse.name}`,
            notes:
              "Legacy-Datenkorrektur: PICKING-Bewegung ohne verknüpfte Reservierung zurückgesetzt",
          }),
        },
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        throw new Error(
          result?.error ?? "Legacy-Datenkorrektur fehlgeschlagen.",
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
          queryKey: ["reservations"],
        }),
      ]);
    },
  });

  return {
    legacyPickingResetMutation,
  };
}
