import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import type { Customer } from "../../../components/organisms/CustomerTable";
import { apiFetch } from "../../../services/api";

type CustomersResponse = {
  data: Customer[];
};

export function useCustomers() {
  const { getToken } = useAuth();

  const query = useQuery({
    queryKey: ["customers"],
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
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
