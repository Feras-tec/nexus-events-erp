import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { Quote } from "../types/quote.types";

export function useQuotes() {
  const { getToken } = useAuth();

  const query = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        "/api/quotes",
        token,
      );

      if (!response.ok) {
        throw new Error(
          `Quotes konnten nicht geladen werden: ${response.status}`,
        );
      }

      return (await response.json()) as Quote[];
    },
  });

  return {
    quotes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
