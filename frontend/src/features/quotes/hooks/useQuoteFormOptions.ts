import { useAppAuth } from "../../auth/AppAuthProvider";
import { useQuery } from "@tanstack/react-query";

import type { Customer } from "../../../components/organisms/CustomerTable";
import type { EventItem } from "../../../components/organisms/EventTable";
import type { ProductTableItem } from "../../../components/organisms/ProductTable";
import { apiFetch } from "../../../services/api";

type UseQuoteFormOptionsOptions = {
  enabled?: boolean;
};

export function useQuoteFormOptions({
  enabled = true,
}: UseQuoteFormOptionsOptions = {}) {
  const { getToken } = useAppAuth();

  const customersQuery = useQuery({
    queryKey: ["customers"],
    enabled,
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
    enabled,
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
    enabled,
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

  return {
    customers: customersQuery.data ?? [],
    events: eventsQuery.data ?? [],
    products: productsQuery.data ?? [],

    isLoading:
      customersQuery.isLoading ||
      eventsQuery.isLoading ||
      productsQuery.isLoading,

    isError:
      customersQuery.isError ||
      eventsQuery.isError ||
      productsQuery.isError,
  };
}
