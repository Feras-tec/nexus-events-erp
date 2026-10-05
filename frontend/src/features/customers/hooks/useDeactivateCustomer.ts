import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

type UseDeactivateCustomerParams = {
  customerId: string;
  onSuccess?: () => void;
};

export function useDeactivateCustomer({
  customerId,
  onSuccess,
}: UseDeactivateCustomerParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const deactivateCustomerMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/customers/${customerId}/deactivate`,
        token,
        {
          method: "PATCH",
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["customers", customerId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["customers"],
        }),
      ]);

      onSuccess?.();
    },
  });

  return {
    deactivateCustomerMutation,
  };
}
