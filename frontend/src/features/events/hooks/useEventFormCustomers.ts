import { useAppAuth } from "../../auth/AppAuthProvider";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

export type EventFormCustomer = {
  id: string;
  customerNo: string;
  type: string;
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

type CustomersResponse = {
  data: EventFormCustomer[];
};

type UseEventFormCustomersOptions = {
  enabled?: boolean;
};

export function useEventFormCustomers({
  enabled = true,
}: UseEventFormCustomersOptions = {}) {
  const { getToken } = useAppAuth();

  const query = useQuery({
    queryKey: ["customers"],
    enabled,
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        "/api/customers",
        token,
      );

      const result =
        (await response.json()) as CustomersResponse;

      return result.data;
    },
  });

  return {
    customers: query.data ?? [],
    customersLoading: query.isLoading,
  };
}
