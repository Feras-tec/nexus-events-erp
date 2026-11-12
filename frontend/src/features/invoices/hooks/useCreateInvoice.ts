import { useAppAuth } from "../../auth/AppAuthProvider";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import i18n from "../../../i18n/config";
import { ApiError, apiFetch } from "../../../services/api";
import type {
  Invoice,
  InvoiceFormData,
} from "../types/invoice.types";

export function useCreateInvoice() {
  const { getToken } = useAppAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (formData: InvoiceFormData) => {
      const token = await getToken();

      const payload = {
        invoiceNo: formData.invoiceNo.trim(),
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

      let response: Response;

      try {
        response = await apiFetch(
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
      } catch (error) {
        const body = error instanceof ApiError ? error.body : null;

        if (
          error instanceof ApiError &&
          error.status === 409 &&
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          body.error === "Quote already has an active invoice"
        ) {
          throw new Error(
            i18n.t("invoices.errors.duplicateQuote"),
          );
        }

        throw error;
      }

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        throw new Error(
          result?.error ||
            `${i18n.t("invoices.errors.create")}: ${response.status}`,
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
