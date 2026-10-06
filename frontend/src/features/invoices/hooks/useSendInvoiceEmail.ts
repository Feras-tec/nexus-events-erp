import { useAuth } from "@clerk/react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

type SendInvoiceEmailVariables = {
  invoiceId: string;
};

type SendInvoiceEmailResponse = {
  message: string;
  recipient: string;
  emailId: string | null;
  sentAt: string;
};

export function useSendInvoiceEmail() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      invoiceId,
    }: SendInvoiceEmailVariables) => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/invoices/${invoiceId}/send-email`,
        token,
        {
          method: "POST",
        },
      );

      return (await response.json()) as SendInvoiceEmailResponse;
    },

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["invoices"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["invoice", variables.invoiceId],
        }),
      ]);
    },
  });

  return {
    sendInvoiceEmail: mutation.mutateAsync,
    isSending: mutation.isPending,
    sendError:
      mutation.error instanceof Error
        ? mutation.error.message
        : null,
  };
}
