import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { EventResponse } from "../types/event.types";

export function useEventDetail(eventId: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["events", eventId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/events/${eventId}`,
        token,
      );

      const result = (await response.json()) as EventResponse;

      return result.data;
    },
  });
}
