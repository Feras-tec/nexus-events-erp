import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

type UseCancelReservationParams = {
  reservationId: string;
  onSuccess?: () => void;
};

export function useCancelReservation({
  reservationId,
  onSuccess,
}: UseCancelReservationParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const cancelReservationMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/reservations/${reservationId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: "CANCELLED",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Reservation could not be cancelled");
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
  });

  return {
    cancelReservationMutation,
  };
}
