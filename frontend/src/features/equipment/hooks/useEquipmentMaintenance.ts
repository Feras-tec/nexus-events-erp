import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { EquipmentDetail } from "../types/equipment.types";

type UseEquipmentMaintenanceParams = {
  equipmentId: string;
  equipment?: EquipmentDetail;
};

export function useEquipmentMaintenance({
  equipmentId,
  equipment,
}: UseEquipmentMaintenanceParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidateMaintenanceQueries = async () => {
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

  const startMaintenanceMutation = useMutation({
    mutationFn: async () =>
      createMovement({
        type: "MAINTENANCE",
        toStatus: "MAINTENANCE",
        toLocation: `Wartungsbereich – ${
          equipment?.warehouse.name ?? "Lager"
        }`,
        notes: "Beschädigtes Gerät zur Wartung übergeben",
      }),
    onSuccess: invalidateMaintenanceQueries,
  });

  const completeRepairMutation = useMutation({
    mutationFn: async () =>
      createMovement({
        type: "REPAIRED",
        toStatus: "REPAIRED",
        toLocation: `Reparatur abgeschlossen – ${
          equipment?.warehouse.name ?? "Lager"
        }`,
        notes: "Wartung abgeschlossen – Gerät wurde repariert",
      }),
    onSuccess: invalidateMaintenanceQueries,
  });

  const returnRepairedToAvailableMutation = useMutation({
    mutationFn: async () =>
      createMovement({
        type: "REPAIRED",
        toStatus: "AVAILABLE",
        toLocation: `Lagerbereich – ${
          equipment?.warehouse.name ?? "Lager"
        }`,
        notes: "Repariertes Gerät wieder einsatzbereit",
      }),
    onSuccess: invalidateMaintenanceQueries,
  });

  return {
    startMaintenanceMutation,
    completeRepairMutation,
    returnRepairedToAvailableMutation,
  };
}
