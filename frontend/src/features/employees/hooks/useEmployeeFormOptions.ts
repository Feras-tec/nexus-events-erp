import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import type {
  BranchOption,
  DepartmentOption,
} from "../../../components/organisms/EmployeeForm";
import { apiFetch } from "../../../services/api";

type BranchesResponse = {
  data: BranchOption[];
};

type DepartmentsResponse = {
  data: DepartmentOption[];
};

export function useEmployeeFormOptions() {
  const { getToken } = useAuth();

  const branchesQuery = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/branches", token);
      const result = (await response.json()) as BranchesResponse;

      return result.data;
    },
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        "/api/departments",
        token,
      );

      const result =
        (await response.json()) as DepartmentsResponse;

      return result.data;
    },
  });

  return {
    branches: branchesQuery.data ?? [],
    branchesLoading: branchesQuery.isLoading,
    branchesError: branchesQuery.isError,

    departments: departmentsQuery.data ?? [],
    departmentsLoading: departmentsQuery.isLoading,
    departmentsError: departmentsQuery.isError,
  };
}
