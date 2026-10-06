import { useAuth } from "@clerk/react";
import { useMutation } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

type SendQuoteEmailResult = {
  message: string;
  recipient: string;
  emailId: string | null;
};

export function useSendQuoteEmail() {
  const { getToken } = useAuth();

  const mutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/quotes/${quoteId}/send-email`,
        token,
        {
          method: "POST",
        },
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `E-Mail konnte nicht gesendet werden: ${response.status}`,
        );
      }

      return result as SendQuoteEmailResult;
    },
  });

  return {
    sendQuoteEmail: mutation.mutateAsync,
    isSending: mutation.isPending,
    sendError:
      mutation.error instanceof Error
        ? mutation.error.message
        : null,
    sentEmail: mutation.data ?? null,
    resetSendEmail: mutation.reset,
  };
}
