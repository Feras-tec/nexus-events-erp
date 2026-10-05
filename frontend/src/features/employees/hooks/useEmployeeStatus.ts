import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

type UseEmployeeStatusParams = {
  employeeId: string;
  onDeactivateSuccess?: () => void;
  onActivateSuccess?: () => void;
};

export function useEmployeeStatus({
  employeeId,
  onDeactivateSuccess,
  onActivateSuccess,
}: UseEmployeeStatusParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidateEmployeeQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["employees", employeeId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["employees"],
      }),
    ]);
  };

  const deactivateEmployeeMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/employees/${employeeId}/deactivate`,
        token,
        {
          method: "PATCH",
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await invalidateEmployeeQueries();
      onDeactivateSuccess?.();
    },
  });

  const activateEmployeeMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/employees/${employeeId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: "ACTIVE",
          }),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await invalidateEmployeeQueries();
      onActivateSuccess?.();
    },
  });

  return {
    deactivateEmployeeMutation,
    activateEmployeeMutation,
  };
}
