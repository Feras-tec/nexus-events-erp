import { useAppAuth } from "../../auth/AppAuthProvider";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { CustomerOption } from "../types/event.types";

type UseEventCustomersOptions = {
  enabled?: boolean;
};

export function useEventCustomers({
  enabled = true,
}: UseEventCustomersOptions = {}) {
  const { getToken } = useAppAuth();

  return useQuery({
    queryKey: ["customers"],
    enabled,
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
