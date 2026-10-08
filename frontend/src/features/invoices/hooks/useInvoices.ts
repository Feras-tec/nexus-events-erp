import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import i18n from "../../../i18n/config";
import { apiFetch } from "../../../services/api";
import type { Invoice } from "../types/invoice.types";

export function useInvoices() {
  const { getToken } = useAuth();

  const query = useQuery({
    queryKey: ["invoices"],
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
