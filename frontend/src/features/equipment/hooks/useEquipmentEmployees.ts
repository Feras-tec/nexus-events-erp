import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type { EmployeesResponse } from "../types/equipment.types";

export function useEquipmentEmployees() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiFetch("/api/employees", token);

      if (!response.ok) {
        throw new Error("Mitarbeiter konnten nicht geladen werden.");
      }

      const result = (await response.json()) as EmployeesResponse;

      return result.data.filter(
        (employee) => employee.status === "ACTIVE",
      );
    },
  });
}
