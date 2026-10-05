import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CustomerFormData } from "../../../components/organisms/CustomerForm";
import { apiFetch } from "../../../services/api";

type UseUpdateCustomerParams = {
  customerId: string;
  onSuccess?: () => void;
};

export function useUpdateCustomer({
  customerId,
  onSuccess,
}: UseUpdateCustomerParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const token = await getToken();

      const payload = {
        type: data.type,

        companyName:
          data.type === "COMPANY"
            ? data.companyName.trim() || undefined
            : undefined,

        firstName:
          data.type === "PRIVATE"
            ? data.firstName.trim() || undefined
            : undefined,

        lastName:
          data.type === "PRIVATE"
            ? data.lastName.trim() || undefined
            : undefined,

        contactName: data.contactName.trim() || undefined,
        email: data.email.trim() || undefined,
        phone: data.phone.trim() || undefined,
        address: data.address.trim() || undefined,
        vatId: data.vatId.trim() || undefined,
        discount: Number(data.discount),
      };

      const response = await apiFetch(
        `/api/customers/${customerId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
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
    updateCustomerMutation,
  };
}
