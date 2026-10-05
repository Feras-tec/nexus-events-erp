import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { EquipmentDetail } from "../types/equipment.types";

type ActiveReservation = {
  id: string;
  event: {
    id: string;
    eventNo: string;
    name: string;
    location?: string | null;
  };
};

type UseEquipmentEventWorkflowParams = {
  equipmentId: string;
  equipment?: EquipmentDetail;
  activeReservation: ActiveReservation | null;
  responsibleEmployeeId: string;
};

export function useEquipmentEventWorkflow({
  equipmentId,
  equipment,
  activeReservation,
  responsibleEmployeeId,
}: UseEquipmentEventWorkflowParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidateWorkflowQueries = async () => {
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

  const requireReservation = () => {
    if (!activeReservation) {
      throw new Error("Keine Reservierung für diese Bewegung gefunden.");
    }

    return activeReservation;
  };

  const startPickingMutation = useMutation({
    mutationFn: async () => {
      const reservation = requireReservation();

      return createMovement({
        type: "PICKED",
        toStatus: "PICKING",
        reservationId: reservation.id,
        notes: "Kommissionierung gestartet",
      });
    },
    onSuccess: invalidateWorkflowQueries,
  });

  const markPackedMutation = useMutation({
    mutationFn: async () => {
      const reservation = requireReservation();

      return createMovement({
        type: "PACKED",
        toStatus: "PACKED",
        reservationId: reservation.id,
        notes: "Gerät wurde gepackt",
      });
    },
    onSuccess: invalidateWorkflowQueries,
  });

  const markLoadedMutation = useMutation({
    mutationFn: async () => {
      const reservation = requireReservation();

      return createMovement({
        type: "LOADED",
        toStatus: "IN_TRANSIT",
        toLocation: "Unterwegs zum Event",
        reservationId: reservation.id,
        responsibleEmployeeId,
        notes: "Gerät wurde verladen",
      });
    },
    onSuccess: invalidateWorkflowQueries,
  });

  const markDeliveredMutation = useMutation({
    mutationFn: async () => {
      const reservation = requireReservation();

      return createMovement({
        type: "DELIVERED_TO_EVENT",
        toStatus: "AT_EVENT",
        toLocation:
          reservation.event.location ||
          reservation.event.name,
        reservationId: reservation.id,
        notes: "Gerät ist am Event angekommen",
      });
    },
    onSuccess: invalidateWorkflowQueries,
  });

  const startReturnMutation = useMutation({
    mutationFn: async () => {
      const reservation = requireReservation();

      return createMovement({
        type: "RETURNED_FROM_EVENT",
        toStatus: "RETURNING",
        toLocation: "Rücktransport zum Lager",
        reservationId: reservation.id,
        notes: "Rücktransport vom Event gestartet",
      });
    },
    onSuccess: invalidateWorkflowQueries,
  });

  const startInspectionMutation = useMutation({
    mutationFn: async () => {
      const reservation = requireReservation();

      return createMovement({
        type: "INSPECTION",
        toStatus: "INSPECTION",
        toLocation: `Prüfbereich – ${equipment?.warehouse.name ?? "Lager"}`,
        reservationId: reservation.id,
        notes: "Geräteprüfung nach Rückkehr gestartet",
      });
    },
    onSuccess: invalidateWorkflowQueries,
  });


  return {
    startPickingMutation,
    markPackedMutation,
    markLoadedMutation,
    markDeliveredMutation,
    startReturnMutation,
    startInspectionMutation,
  };
}
