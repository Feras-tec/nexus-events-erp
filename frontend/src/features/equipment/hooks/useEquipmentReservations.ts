import { useAppAuth } from "../../auth/AppAuthProvider";
import { useQuery } from "@tanstack/react-query";

import type { ReservationItem } from "../../../components/organisms/ReservationTable";
import { apiFetch } from "../../../services/api";

export function useEquipmentReservations() {
  const { getToken } = useAppAuth();

  return useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiFetch("/api/reservations", token);

      if (!response.ok) {
        throw new Error("Reservierungen konnten nicht geladen werden.");
      }

      return (await response.json()) as ReservationItem[];
    },
  });
}
