import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { EquipmentDetail } from "../types/equipment.types";

type ActiveReservation = {
  id: string;
};

type UseEquipmentLifecycleParams = {
  equipmentId: string;
  equipment?: EquipmentDetail;
  activeReservation: ActiveReservation | null;
};

export function useEquipmentLifecycle({
  equipmentId,
  equipment,
  activeReservation,
}: UseEquipmentLifecycleParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidateLifecycleQueries = async () => {
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

  const createMovement = async (body: Record<string, unknown>) => {
    const token = await getToken();

    const response = await apiFetch(
      `/api/equipment-movements/${equipmentId}`,
      token,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const result = await response.json().catch(() => null);

      throw new Error(
        result?.error ?? "Gerätebewegung konnte nicht gespeichert werden.",
      );
    }

    return response.json();
  };

  const reportLostMutation = useMutation({
    mutationFn: async () =>
      createMovement({
        type: "LOST",
        toStatus: "LOST",
        toLocation: "Unbekannt – Gerät als verloren gemeldet",
        notes: "Gerät als verloren gemeldet",
        ...(activeReservation
          ? { reservationId: activeReservation.id }
          : {}),
      }),
    onSuccess: invalidateLifecycleQueries,
  });

  const recoverLostMutation = useMutation({
    mutationFn: async () =>
      createMovement({
        type: "RECOVERED",
        toStatus: "AVAILABLE",
        toLocation: `Lagerbereich – ${equipment?.warehouse.name ?? "Lager"}`,
        notes:
          "Verlorenes Gerät wiedergefunden und zurück ins Lager gebracht",
      }),
    onSuccess: invalidateLifecycleQueries,
  });

  const retireEquipmentMutation = useMutation({
    mutationFn: async () =>
      createMovement({
        type: "RETIRED",
        toStatus: "RETIRED",
        toLocation: "Ausgemustert",
        notes: "Gerät dauerhaft ausgemustert",
      }),
    onSuccess: invalidateLifecycleQueries,
  });

  return {
    reportLostMutation,
    recoverLostMutation,
    retireEquipmentMutation,
  };
}
