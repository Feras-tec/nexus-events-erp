import { useAuth } from "@clerk/react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import i18n from "../../../i18n/config";
import { apiFetch } from "../../../services/api";
import type {
  Invoice,
  InvoiceFormData,
} from "../types/invoice.types";

type UpdateInvoiceVariables = {
  invoiceId: string;
  data: InvoiceFormData;
};

export function useUpdateInvoice() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      invoiceId,
      data,
    }: UpdateInvoiceVariables) => {
      const token = await getToken();

      const payload = {
        invoiceNo: data.invoiceNo.trim(),
        status: data.status,
        customerId: data.customerId,

        ...(data.eventId
          ? { eventId: data.eventId }
          : {}),

        ...(data.quoteId
          ? { quoteId: data.quoteId }
          : {}),

        ...(data.issueDate
          ? { issueDate: data.issueDate }
          : {}),

        ...(data.dueDate
          ? { dueDate: data.dueDate }
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
        `/api/invoices/${invoiceId}`,
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
            `${i18n.t("invoices.errors.update")}: ${response.status}`,
        );
      }

      return (await response.json()) as Invoice;
    },

    onSuccess: async (invoice) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["invoices"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["invoice", invoice.id],
        }),
      ]);
    },
  });

  return {
    updateInvoice: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError:
      mutation.error instanceof Error
        ? mutation.error.message
        : null,
  };
}
