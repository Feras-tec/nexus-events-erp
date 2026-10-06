import { useAuth } from "@clerk/react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type {
  Invoice,
  InvoiceFormData,
} from "../types/invoice.types";

export function useCreateInvoice() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (formData: InvoiceFormData) => {
      const token = await getToken();

      const payload = {
        invoiceNo: formData.invoiceNo.trim(),
        status: formData.status,
        customerId: formData.customerId,

        ...(formData.eventId
          ? { eventId: formData.eventId }
          : {}),

        ...(formData.quoteId
          ? { quoteId: formData.quoteId }
          : {}),

        ...(formData.issueDate
          ? { issueDate: formData.issueDate }
          : {}),

        ...(formData.dueDate
          ? { dueDate: formData.dueDate }
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
        "/api/invoices",
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
            `Rechnung konnte nicht erstellt werden: ${response.status}`,
        );
      }

      return (await response.json()) as Invoice;
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["invoices"],
      });
    },
  });

  return {
    createInvoice: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError:
      mutation.error instanceof Error
        ? mutation.error.message
        : null,
  };
}
