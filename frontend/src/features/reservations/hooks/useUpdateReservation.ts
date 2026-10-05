import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ReservationFormData } from "../../../components/organisms/ReservationForm";
import { apiFetch } from "../../../services/api";
import type { ApiError } from "../types/reservation.types";

type UseUpdateReservationParams = {
  reservationId: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export function useUpdateReservation({
  reservationId,
  onSuccess,
  onError,
}: UseUpdateReservationParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const updateReservationMutation = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      const token = await getToken();

      const payload = {
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        status: data.status,
        notes: data.notes.trim() || undefined,
      };

      const response = await apiFetch(
        `/api/reservations/${reservationId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as ApiError;

        if (response.status === 409) {
          throw new Error(
            "Dieses Gerät ist im ausgewählten Zeitraum bereits reserviert.",
          );
        }

        throw new Error(
          result.error || "Änderungen konnten nicht gespeichert werden.",
        );
      }

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["reservations", reservationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["reservations"],
        }),
      ]);

      onSuccess?.();
    },

    onError: (error) => {
      onError?.(
        error instanceof Error
          ? error.message
          : "Änderungen konnten nicht gespeichert werden.",
      );
    },
  });

  return {
    updateReservationMutation,
  };
}
