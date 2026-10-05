import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { ReservationDetail } from "../types/reservation.types";

export function useReservationDetail(reservationId: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["reservations", reservationId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/reservations/${reservationId}`,
        token,
      );

      if (!response.ok) {
        throw new Error("Reservation could not be loaded");
      }

      return (await response.json()) as ReservationDetail;
    },
  });
}
