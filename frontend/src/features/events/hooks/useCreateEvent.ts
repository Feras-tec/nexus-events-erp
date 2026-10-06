import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { EventFormData } from "../../../components/organisms/EventForm";
import { apiFetch } from "../../../services/api";

type UseCreateEventParams = {
  onSuccess?: () => void;
};

export function useCreateEvent({
  onSuccess,
}: UseCreateEventParams = {}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const token = await getToken();

      const payload = {
        ...data,
        type: data.type || undefined,
        location: data.location || undefined,
        description: data.description || undefined,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };

      const response = await apiFetch(
        "/api/events",
        token,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["events"],
      });

      onSuccess?.();
    },
  });

  return {
    createEventMutation,
  };
}
