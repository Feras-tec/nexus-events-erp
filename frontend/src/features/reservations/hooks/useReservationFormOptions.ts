import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import type { EventItem } from "../../../components/organisms/EventTable";
import { apiFetch } from "../../../services/api";

export type EquipmentItem = {
  id: string;
  assetNo: string;
  manufacturerSerial?: string | null;
  status: string;
  location?: string | null;

  product: {
    id: string;
    productNo: string;
    name: string;
    brand?: string | null;
    model?: string | null;
  };

  warehouse: {
    id: string;
    name: string;
  };
};

export function useReservationFormOptions() {
  const { getToken } = useAuth();

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/events", token);

      if (!response.ok) {
        throw new Error("Events could not be loaded");
      }

      const result = (await response.json()) as {
        data: EventItem[];
      };

      return result.data;
    },
  });

  const equipmentQuery = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        "/api/inventory-items",
        token,
      );

      if (!response.ok) {
        throw new Error("Equipment could not be loaded");
      }

      const result = (await response.json()) as {
        data: EquipmentItem[];
      };

      return result.data;
    },
  });

  return {
    events: eventsQuery.data ?? [],
    eventsLoading: eventsQuery.isLoading,
    equipment: equipmentQuery.data ?? [],
    equipmentLoading: equipmentQuery.isLoading,
  };
}
