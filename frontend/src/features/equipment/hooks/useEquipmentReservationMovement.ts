import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

type UseEquipmentReservationMovementParams = {
  equipmentId: string;
};

export function useEquipmentReservationMovement({
  equipmentId,
}: UseEquipmentReservationMovementParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const createMovementMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type: "RESERVED",
            toStatus: "RESERVED",
            reservationId,
            notes: "Für Event reserviert",
          }),
        },
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        throw new Error(
          result?.error ??
            "Reservierungsbewegung konnte nicht gespeichert werden.",
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
      ]);
    },
  });

  return {
    createMovementMutation,
  };
}
