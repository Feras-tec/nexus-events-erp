import { useAuth } from "@clerk/react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type {
  Quote,
  QuoteFormData,
} from "../types/quote.types";

type UpdateQuoteVariables = {
  quoteId: string;
  data: QuoteFormData;
};

export function useUpdateQuote() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      quoteId,
      data,
    }: UpdateQuoteVariables) => {
      const token = await getToken();

      const payload = {
        quoteNo: data.quoteNo.trim(),
        status: data.status,
        customerId: data.customerId,

        ...(data.eventId
          ? { eventId: data.eventId }
          : {}),

        ...(data.validUntil
          ? { validUntil: data.validUntil }
          : {}),

        ...(data.notes.trim()
          ? { notes: data.notes.trim() }
          : {}),

        tax: Number(data.tax),
        discount: Number(data.discount),

        items: data.items.map((item) => ({
          type: item.type,
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),

          ...(item.productId
            ? { productId: item.productId }
            : {}),
        })),
      };

      const response = await apiFetch(
        `/api/quotes/${quoteId}`,
        token,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        throw new Error(
          result?.error ||
            `Angebot konnte nicht aktualisiert werden: ${response.status}`,
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
    updateQuote: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError:
      mutation.error instanceof Error
        ? mutation.error.message
        : null,
  };
}
