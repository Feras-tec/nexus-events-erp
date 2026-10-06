import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CustomerFormData } from "../../../components/organisms/CustomerForm";
import { apiFetch } from "../../../services/api";

type UseCreateCustomerParams = {
  onSuccess?: () => void;
};

export function useCreateCustomer({
  onSuccess,
}: UseCreateCustomerParams = {}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const token = await getToken();

      const payload = {
        customerNo: data.customerNo.trim(),
        type: data.type,
        companyName:
          data.type === "COMPANY"
            ? data.companyName.trim()
            : undefined,
        firstName:
          data.type === "PRIVATE"
            ? data.firstName.trim()
            : undefined,
        lastName:
          data.type === "PRIVATE"
            ? data.lastName.trim()
            : undefined,
        contactName: data.contactName.trim() || undefined,
        email: data.email.trim() || undefined,
        phone: data.phone.trim() || undefined,
        address: data.address.trim() || undefined,
        vatId: data.vatId.trim() || undefined,
        discount: Number(data.discount),
      };

      const response = await apiFetch(
        "/api/customers",
        token,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["customers"],
      });

      onSuccess?.();
    },
  });

  return {
    createCustomerMutation,
  };
}
