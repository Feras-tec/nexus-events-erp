import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { EventFormData } from "../../../components/organisms/EventForm";
import { apiFetch } from "../../../services/api";

type UseUpdateEventParams = {
  eventId: string;
  onSuccess?: () => void;
};

export function useUpdateEvent({
  eventId,
  onSuccess,
}: UseUpdateEventParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const updateEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const token = await getToken();

      const payload = {
        name: data.name,
        type: data.type || undefined,
        location: data.location || undefined,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        status: data.status,
        description: data.description || undefined,
      };

      const response = await apiFetch(
        `/api/events/${eventId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["events", eventId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["events"],
        }),
      ]);

      onSuccess?.();
    },
  });

  return { updateEventMutation };
}
