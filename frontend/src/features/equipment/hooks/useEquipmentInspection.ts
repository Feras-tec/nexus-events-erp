import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type {
  EquipmentDetail,
  EquipmentMovement,
} from "../types/equipment.types";

type ActiveReservation = NonNullable<EquipmentMovement["reservation"]>;

type InspectionResult = "AVAILABLE" | "DAMAGED" | "MAINTENANCE";

type UseEquipmentInspectionParams = {
  equipmentId: string;
  equipment?: EquipmentDetail;
  activeReservation: ActiveReservation | null;
};

export function useEquipmentInspection({
  equipmentId,
  equipment,
  activeReservation,
}: UseEquipmentInspectionParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidateInspectionQueries = async () => {
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
  };

  const completeInspectionMutation = useMutation({
    mutationFn: async (result: InspectionResult) => {
      if (!activeReservation) {
        throw new Error(
          "Keine Reservierung für diese Bewegung gefunden.",
        );
      }

      const notes = {
        AVAILABLE: "Prüfung abgeschlossen – Gerät ist einsatzbereit",
        DAMAGED: "Prüfung abgeschlossen – Gerät ist beschädigt",
        MAINTENANCE: "Prüfung abgeschlossen – Wartung erforderlich",
      }[result];

      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type:
              result === "MAINTENANCE"
                ? "MAINTENANCE"
                : "INSPECTION",
            toStatus: result,
            ...(result === "AVAILABLE"
              ? {
                  toLocation: `Lagerbereich – ${
                    equipment?.warehouse.name ?? "Lager"
                  }`,
                }
              : {}),
            reservationId: activeReservation.id,
            notes,
          }),
        },
      );

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);

        throw new Error(
          responseBody?.error ??
            "Geräteprüfung konnte nicht abgeschlossen werden.",
        );
      }

      return response.json();
    },
    onSuccess: invalidateInspectionQueries,
  });

  return {
    completeInspectionMutation,
  };
}
