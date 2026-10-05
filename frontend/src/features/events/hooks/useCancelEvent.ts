import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

type UseCancelEventParams = {
  eventId: string;
  onSuccess?: () => void;
};

export function useCancelEvent({
  eventId,
  onSuccess,
}: UseCancelEventParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const cancelEventMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/events/${eventId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: "CANCELLED",
          }),
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

  return { cancelEventMutation };
}
