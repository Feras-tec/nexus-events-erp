import { useAppAuth } from "../../auth/AppAuthProvider";
import { useQuery } from "@tanstack/react-query";

import type { EventItem } from "../../../components/organisms/EventTable";
import { apiFetch } from "../../../services/api";

type EventsResponse = {
  data: EventItem[];
};

type UseEventsOptions = {
  enabled?: boolean;
};

export function useEvents({ enabled = true }: UseEventsOptions = {}) {
  const { getToken } = useAppAuth();

  const query = useQuery({
    queryKey: ["events"],
    enabled,
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        "/api/events",
        token,
      );

      const result =
        (await response.json()) as EventsResponse;

      return result.data;
    },
  });

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
