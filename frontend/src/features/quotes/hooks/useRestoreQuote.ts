import { useAuth } from "@clerk/react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { Quote } from "../types/quote.types";

export function useRestoreQuote() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/quotes/${quoteId}/restore`,
        token,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const result = await response
          .json()
          .catch(() => null);

        throw new Error(
          result?.error ||
            `Stornierung konnte nicht aufgehoben werden: ${response.status}`,
        );
      }

      return (await response.json()) as Quote;
    },

    onSuccess: async (quote) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["quotes"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["quote", quote.id],
        }),
      ]);
    },
  });

  return {
    restoreQuote: mutation.mutateAsync,
    isRestoring: mutation.isPending,
    restoreError:
      mutation.error instanceof Error
        ? mutation.error.message
        : null,
  };
}
