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

export function useCreateQuote() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (formData: QuoteFormData) => {
      const token = await getToken();

      const payload = {
        quoteNo: formData.quoteNo.trim(),
        status: formData.status,
        customerId: formData.customerId,

        ...(formData.eventId
          ? { eventId: formData.eventId }
          : {}),

        ...(formData.validUntil
          ? { validUntil: formData.validUntil }
          : {}),

        ...(formData.notes.trim()
          ? { notes: formData.notes.trim() }
          : {}),

        tax: Number(formData.tax),
        discount: Number(formData.discount),

        items: formData.items.map((item) => ({
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
        "/api/quotes",
        token,
        {
          method: "POST",
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
            `Angebot konnte nicht erstellt werden: ${response.status}`,
        );
      }

      return (await response.json()) as Quote;
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["quotes"],
      });
    },
  });

  return {
    createQuote: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError:
      mutation.error instanceof Error
        ? mutation.error.message
        : null,
  };
}
