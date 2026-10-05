import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { EmployeeFormValues } from "../../../components/organisms/EmployeeForm";
import { apiFetch } from "../../../services/api";

type UseUpdateEmployeeParams = {
  employeeId: string;
  onSuccess?: () => void;
};

export function useUpdateEmployee({
  employeeId,
  onSuccess,
}: UseUpdateEmployeeParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormValues) => {
      const token = await getToken();

      const payload = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim() || undefined,
        phone: data.phone.trim() || undefined,
        birthDate: data.birthDate || undefined,
        nationality: data.nationality.trim() || undefined,
        position: data.position.trim() || undefined,
        departmentId: data.departmentId || undefined,
        status: data.status,
      };

      const response = await apiFetch(
        `/api/employees/${employeeId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        throw new Error(
          result?.error ?? "Mitarbeiter konnte nicht aktualisiert werden.",
        );
      }

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["employees", employeeId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["employees"],
        }),
      ]);

      onSuccess?.();
    },
  });

  return {
    updateEmployeeMutation,
  };
}
