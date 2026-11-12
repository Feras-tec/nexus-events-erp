import { useAppAuth } from "../../auth/AppAuthProvider";
import { useQuery } from "@tanstack/react-query";

import type { ReservationItem } from "../../../components/organisms/ReservationTable";
import { apiFetch } from "../../../services/api";

type UseReservationsOptions = {
  enabled?: boolean;
};

export function useReservations({
  enabled = true,
}: UseReservationsOptions = {}) {
  const { getToken } = useAppAuth();

  return useQuery({
    queryKey: ["reservations"],
    enabled,
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        "/api/reservations",
        token,
      );

      if (!response.ok) {
        throw new Error(
          "Reservations could not be loaded",
        );
      }

      return (await response.json()) as ReservationItem[];
    },
  });
}
