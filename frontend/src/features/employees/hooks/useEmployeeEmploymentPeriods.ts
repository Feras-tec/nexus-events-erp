import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { EmploymentPeriodFormData } from "../../../components/organisms/EmploymentPeriodForm";
import { apiFetch } from "../../../services/api";

type UseEmployeeEmploymentPeriodsParams = {
  employeeId: string;
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
  onDeleteSuccess?: () => void;
};

export function useEmployeeEmploymentPeriods({
  employeeId,
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
}: UseEmployeeEmploymentPeriodsParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidateEmployee = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["employees", employeeId],
    });
  };

  const createEmploymentPeriodMutation = useMutation({
    mutationFn: async (data: EmploymentPeriodFormData) => {
      const token = await getToken();

      const payload = {
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        position: data.position.trim() || undefined,
        reason: data.reason.trim() || undefined,
      };

      const response = await apiFetch(
        `/api/employees/${employeeId}/employment-periods`,
        token,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await invalidateEmployee();
      onCreateSuccess?.();
    },
  });

  const updateEmploymentPeriodMutation = useMutation({
    mutationFn: async ({
      periodId,
      data,
    }: {
      periodId: string;
      data: EmploymentPeriodFormData;
    }) => {
      const token = await getToken();

      const payload = {
        startDate: data.startDate,
        endDate: data.endDate || null,
        position: data.position.trim() || null,
        reason: data.reason.trim() || null,
      };

      const response = await apiFetch(
        `/api/employees/${employeeId}/employment-periods/${periodId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await invalidateEmployee();
      onUpdateSuccess?.();
    },
  });

  const deleteEmploymentPeriodMutation = useMutation({
    mutationFn: async (periodId: string) => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/employees/${employeeId}/employment-periods/${periodId}`,
        token,
        {
          method: "DELETE",
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await invalidateEmployee();
      onDeleteSuccess?.();
    },
  });

  return {
    createEmploymentPeriodMutation,
    updateEmploymentPeriodMutation,
    deleteEmploymentPeriodMutation,
  };
}
