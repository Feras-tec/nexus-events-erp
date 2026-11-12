import { useAppAuth } from "../../auth/AppAuthProvider";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type {
  CustomerOption,
  EventOption,
  ProductOption,
  QuoteOption,
} from "../types/invoice.types";

type InvoiceFormOptionsResponse = {
  customers: CustomerOption[];
  events: EventOption[];
  products: ProductOption[];
  quotes: QuoteOption[];
};

type UseInvoiceFormOptionsOptions = {
  enabled?: boolean;
};

// Ein schmaler Endpunkt liefert nur die für das Rechnungsformular nötigen
// Felder. So benötigen Rechnungsrollen keinen Zugriff auf allgemeine
// Kunden-, Event- oder Produktlisten.
export function useInvoiceFormOptions({
  enabled = true,
}: UseInvoiceFormOptionsOptions = {}) {
  const { getToken } = useAppAuth();

  const query = useQuery({
    queryKey: ["invoice-form-options"],
    enabled,
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        "/api/invoices/form-options",
        token,
      );

      return (await response.json()) as InvoiceFormOptionsResponse;
    },
  });

  return {
    customers: query.data?.customers ?? [],
    events: query.data?.events ?? [],
    products: query.data?.products ?? [],
    quotes: query.data?.quotes ?? [],

    isLoading: query.isLoading,
    isError: query.isError,
  };
}
