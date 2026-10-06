import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import type { Customer } from "../../../components/organisms/CustomerTable";
import type { EventItem } from "../../../components/organisms/EventTable";
import type { ProductTableItem } from "../../../components/organisms/ProductTable";
import { apiFetch } from "../../../services/api";
import type { Quote } from "../../quotes/types/quote.types";

export function useInvoiceFormOptions() {
  const { getToken } = useAuth();

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiFetch("/api/customers", token);

      if (!response.ok) {
        throw new Error("Customers could not be loaded");
      }

      const result = (await response.json()) as {
        data: Customer[];
      };

      return result.data.filter((customer) => customer.isActive);
    },
  });

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiFetch("/api/events", token);

      if (!response.ok) {
        throw new Error("Events could not be loaded");
      }

      const result = (await response.json()) as {
        data: EventItem[];
      };

      return result.data;
    },
  });

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiFetch("/api/products", token);

      if (!response.ok) {
        throw new Error("Products could not be loaded");
      }

      const result = (await response.json()) as {
        data: ProductTableItem[];
      };

      return result.data.filter((product) => product.isActive);
    },
  });

  const quotesQuery = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiFetch("/api/quotes", token);

      if (!response.ok) {
        throw new Error("Quotes could not be loaded");
      }

      const quotes = (await response.json()) as Quote[];

      return quotes.filter((quote) => quote.status === "ACCEPTED");
    },
  });

  return {
    customers: customersQuery.data ?? [],
    events: eventsQuery.data ?? [],
    products: productsQuery.data ?? [],
    quotes: quotesQuery.data ?? [],

    isLoading:
      customersQuery.isLoading ||
      eventsQuery.isLoading ||
      productsQuery.isLoading ||
      quotesQuery.isLoading,

    isError:
      customersQuery.isError ||
      eventsQuery.isError ||
      productsQuery.isError ||
      quotesQuery.isError,
  };
}
