import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { CustomerResponse } from "../types/customer.types";

export function useCustomerDetail(customerId: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["customers", customerId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/customers/${customerId}`,
        token,
      );

      const result = (await response.json()) as CustomerResponse;

      return result.data;
    },
  });
}
