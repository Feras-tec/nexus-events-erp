import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { EmployeeResponse } from "../types/employee.types";

export function useEmployeeDetail(employeeId: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["employees", employeeId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/employees/${employeeId}`,
        token,
      );

      if (!response.ok) {
        throw new Error("Mitarbeiter konnte nicht geladen werden.");
      }

      const result = (await response.json()) as EmployeeResponse;

      return result.data;
    },
  });
}
