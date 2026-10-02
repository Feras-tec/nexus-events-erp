import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { EmployeeTable } from "../components/organisms/EmployeeTable";
import { ListLayout } from "../components/templates/ListLayout";
import { apiFetch } from "../services/api";

type Employee = {
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

export function EmployeesPage() {
  const { getToken } = useAuth();
  const [search, setSearch] = useState("");

  const {
    data: employees = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const token = await getToken();


      const response = await apiFetch("/api/employees", token);

      const result = (await response.json()) as EmployeesResponse;

      return result.data;
    },
  });

  const normalizedSearch = search.trim().toLowerCase();

  const filteredEmployees = employees.filter((employee) => {
    if (!normalizedSearch) {
      return true;
    }

    const searchableText = [
      employee.employeeNo,
      employee.firstName,
      employee.lastName,
      employee.email,
      employee.position,
      employee.department?.name,
      employee.branch.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  return (
    <ListLayout
      title="Mitarbeiter"
      description="Mitarbeiter und ihre Zuordnung verwalten."
      searchValue={search}
      searchPlaceholder="Mitarbeiter suchen..."
      onSearchChange={setSearch}
    >
      {isLoading && (
        <div className="flex justify-center py-12">
          <span
            className="loading loading-spinner loading-lg"
            aria-label="Mitarbeiter werden geladen"
          />
        </div>
      )}

      {isError && (
        <div role="alert" className="alert alert-error">
          Mitarbeiter konnten nicht geladen werden.
        </div>
      )}

      {!isLoading && !isError && (
        <EmployeeTable employees={filteredEmployees} />
      )}
    </ListLayout>
  );
}
