import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "../components/atoms/Button";
import {
  EmployeeForm,
  type BranchOption,
  type DepartmentOption,
  type EmployeeFormValues,
} from "../components/organisms/EmployeeForm";
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

type BranchesResponse = {
  data: BranchOption[];
};

type DepartmentsResponse = {
  data: DepartmentOption[];
};

export function EmployeesPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  const {
    data: branches = [],
    isLoading: branchesLoading,
    isError: branchesError,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/branches", token);
      const result = (await response.json()) as BranchesResponse;

      return result.data;
    },
  });

  const {
    data: departments = [],
    isLoading: departmentsLoading,
    isError: departmentsError,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/departments", token);
      const result = (await response.json()) as DepartmentsResponse;

      return result.data;
    },
  });

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

      const response = await apiFetch("/api/employees", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return response.json();
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["employees"],
      });

      setShowCreateForm(false);
    },
  });

  const normalizedSearch = search.trim().toLowerCase();

  const filteredEmployees = employees.filter((employee) => {
    if (!normalizedSearch) return true;

    const searchableText = [
      employee.employeeNo,
      employee.firstName,
      employee.lastName,
      employee.email,
      employee.phone,
      employee.position,
      employee.status,
      employee.department?.name,
      employee.branch.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  const formDataLoading = branchesLoading || departmentsLoading;
  const formDataError = branchesError || departmentsError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <ListLayout
        title="Mitarbeiter"
        description="Mitarbeiter und ihre Zuordnung verwalten."
        searchValue={search}
        searchPlaceholder="Mitarbeiter suchen..."
        onSearchChange={setSearch}
        actions={
          <Button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
          >
            {showCreateForm ? "Abbrechen" : "Neuer Mitarbeiter"}
          </Button>
        }
      >
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              {formDataLoading && (
                <div className="flex justify-center py-8">
                  <span
                    className="loading loading-spinner loading-lg"
                    aria-label="Formulardaten werden geladen"
                  />
                </div>
              )}

              {formDataError && (
                <div role="alert" className="alert alert-error">
                  Niederlassungen oder Abteilungen konnten nicht geladen werden.
                </div>
              )}

              {!formDataLoading && !formDataError && (
                <EmployeeForm
                  branches={branches}
                  departments={departments}
                  loading={createEmployeeMutation.isPending}
                  onSubmit={(data) => createEmployeeMutation.mutate(data)}
                />
              )}

              {createEmployeeMutation.isError && (
                <div role="alert" className="alert alert-error mt-4">
                  Mitarbeiter konnte nicht erstellt werden.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
          <EmployeeTable
            employees={filteredEmployees}
            onView={(employeeId) => {
              navigate({
                to: "/employees/$employeeId",
                params: {
                  employeeId,
                },
              });
            }}
          />
        )}
      </ListLayout>
    </motion.div>
  );
}
