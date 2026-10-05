import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";
import type {
  BranchesResponse,
  DepartmentsResponse,
} from "../types/employee.types";

export function useEmployeeOptions() {
  const { getToken } = useAuth();

  const branchesQuery = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiFetch("/api/branches", token);

      if (!response.ok) {
        throw new Error("Standorte konnten nicht geladen werden.");
      }

      const result = (await response.json()) as BranchesResponse;
      return result.data;
    },
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiFetch("/api/departments", token);

      if (!response.ok) {
        throw new Error("Abteilungen konnten nicht geladen werden.");
      }

      const result = (await response.json()) as DepartmentsResponse;
      return result.data;
    },
  });

  return {
    branches: branchesQuery.data ?? [],
    departments: departmentsQuery.data ?? [],
    branchesQuery,
    departmentsQuery,
  };
}
