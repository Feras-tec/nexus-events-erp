import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { EmployeeFormValues } from "../../../components/organisms/EmployeeForm";
import { apiFetch } from "../../../services/api";

type UseCreateEmployeeParams = {
  onSuccess?: () => void;
};

export function useCreateEmployee({
  onSuccess,
}: UseCreateEmployeeParams = {}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormValues) => {
      const token = await getToken();

      const payload = {
        employeeNo: data.employeeNo.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim() || undefined,
        phone: data.phone.trim() || undefined,
        birthDate: data.birthDate || undefined,
        nationality: data.nationality.trim() || undefined,
        position: data.position.trim() || undefined,
        branchId: data.branchId,
        departmentId: data.departmentId || undefined,
      };

      const response = await apiFetch(
        "/api/employees",
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
        queryKey: ["employees"],
      });

      onSuccess?.();
    },
  });

  return {
    createEmployeeMutation,
  };
}
