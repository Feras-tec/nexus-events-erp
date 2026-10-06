import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { Quote } from "../types/quote.types";

export function useQuoteDetail(quoteId: string) {
  const { getToken } = useAuth();

  const query = useQuery({
    queryKey: ["quotes", quoteId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/quotes/${quoteId}`,
        token,
      );

      if (!response.ok) {
        throw new Error(
          `Angebot konnte nicht geladen werden: ${response.status}`,
        );
      }

      return (await response.json()) as Quote;
    },
    enabled: Boolean(quoteId),
  });

  return {
    quote: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
