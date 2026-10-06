import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

export type Employee = {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  status: string;
  branch: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  } | null;
};

type EmployeesResponse = {
  data: Employee[];
};

export function useEmployees() {
  const { getToken } = useAuth();

  const query = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        "/api/employees",
        token,
      );

      const result =
        (await response.json()) as EmployeesResponse;

      return result.data;
    },
  });

  return {
    employees: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
