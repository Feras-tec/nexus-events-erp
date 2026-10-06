import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ReservationFormData } from "../../../components/organisms/ReservationForm";
import { apiFetch } from "../../../services/api";

type ApiError = {
  error?: string;
};

type UseCreateReservationParams = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export function useCreateReservation({
  onSuccess,
  onError,
}: UseCreateReservationParams = {}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const createReservationMutation = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      const token = await getToken();

      const payload = {
        eventId: data.eventId,
        inventoryItemId: data.inventoryItemId,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        status: data.status,
        notes: data.notes.trim() || undefined,
      };

      let response: Response;

      try {
        response = await apiFetch("/api/reservations", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "API-Fehler: 409"
        ) {
          throw new Error(
            "Dieses Gerät ist im ausgewählten Zeitraum bereits reserviert.",
          );
        }

        throw error;
      }

      if (!response.ok) {
        const result = (await response
          .json()
          .catch(() => ({}))) as ApiError;

        if (
          response.status === 409 ||
          result.error ===
            "Inventory item is already reserved for this period"
        ) {
          throw new Error(
            "Dieses Gerät ist im ausgewählten Zeitraum bereits reserviert.",
          );
        }

        if (
          result.error ===
          "Inventory item is not available for reservation"
        ) {
          throw new Error(
            "Dieses Gerät kann derzeit nicht reserviert werden.",
          );
        }

        throw new Error(
          result.error ||
            "Reservierung konnte nicht gespeichert werden.",
        );
      }

      return response.json();
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["reservations"],
      });

      onSuccess?.();
    },

    onError: (error) => {
      onError?.(
        error instanceof Error
          ? error.message
          : "Reservierung konnte nicht gespeichert werden.",
      );
    },
  });

  return {
    createReservationMutation,
  };
}
