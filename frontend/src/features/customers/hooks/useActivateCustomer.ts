import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

type UseActivateCustomerParams = {
  customerId: string;
  onSuccess?: () => void;
};

export function useActivateCustomer({
  customerId,
  onSuccess,
}: UseActivateCustomerParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const activateCustomerMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/customers/${customerId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({
            isActive: true,
          }),
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
    activateCustomerMutation,
  };
}
