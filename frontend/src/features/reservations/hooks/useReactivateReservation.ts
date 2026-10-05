import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

type UseReactivateReservationParams = {
  reservationId: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export function useReactivateReservation({
  reservationId,
  onSuccess,
  onError,
}: UseReactivateReservationParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const reactivateReservationMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      try {
        const response = await apiFetch(
          `/api/reservations/${reservationId}`,
          token,
          {
            method: "PATCH",
            body: JSON.stringify({
              status: "CONFIRMED",
            }),
          },
        );

        return response.json();
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "API-Fehler: 409"
        ) {
          throw new Error(
            "Die Reservierung kann nicht reaktiviert werden, weil das Gerät in diesem Zeitraum bereits reserviert ist.",
          );
        }

        throw error;
      }
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
          : "Reservierung konnte nicht reaktiviert werden.",
      );
    },
  });

  return {
    reactivateReservationMutation,
  };
}
