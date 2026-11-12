import { useAppAuth } from "../../auth/AppAuthProvider";
import { useQuery } from "@tanstack/react-query";

import i18n from "../../../i18n/config";
import { apiFetch } from "../../../services/api";
import type { Invoice } from "../types/invoice.types";

type UseInvoicesOptions = {
  enabled?: boolean;
};

export function useInvoices({ enabled = true }: UseInvoicesOptions = {}) {
  const { getToken } = useAppAuth();

  const query = useQuery({
    queryKey: ["invoices"],
    enabled,
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        "/api/invoices",
        token,
      );

      if (!response.ok) {
        throw new Error(
          `${i18n.t("invoices.errors.load")}: ${response.status}`,
        );
      }

      return (await response.json()) as Invoice[];
    },
  });

  return {
    invoices: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
