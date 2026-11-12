import { useAppAuth } from "../../auth/AppAuthProvider";
import { useQuery } from "@tanstack/react-query";

import type { Customer } from "../../../components/organisms/CustomerTable";
import { apiFetch } from "../../../services/api";

type CustomersResponse = {
  data: Customer[];
};

type UseCustomersOptions = {
  enabled?: boolean;
};

export function useCustomers({ enabled = true }: UseCustomersOptions = {}) {
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
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
