import { useAuth } from "@clerk/react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type {
  Quote,
  QuoteStatus,
} from "../types/quote.types";

type QuoteStatusActionVariables = {
  quoteId: string;
  status: QuoteStatus;
};

export function useQuoteStatusAction() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      quoteId,
      status,
    }: QuoteStatusActionVariables) => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/quotes/${quoteId}`,
        token,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        const result = await response
          .json()
          .catch(() => null);

        throw new Error(
          result?.error ||
            `Angebotsstatus konnte nicht geändert werden: ${response.status}`,
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
    changeQuoteStatus: mutation.mutateAsync,
    isChangingStatus: mutation.isPending,
    statusError:
      mutation.error instanceof Error
        ? mutation.error.message
        : null,
  };
}
