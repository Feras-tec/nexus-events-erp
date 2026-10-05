import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { CustomerOption } from "../types/event.types";

export function useEventCustomers() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/customers", token);

      const result = (await response.json()) as {
        data: CustomerOption[];
      };

      return result.data;
    },
  });
}
