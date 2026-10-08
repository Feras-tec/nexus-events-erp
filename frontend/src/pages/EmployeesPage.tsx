import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "../components/atoms/Button";
import {
  EmployeeForm,
} from "../components/organisms/EmployeeForm";
import { EmployeeTable } from "../components/organisms/EmployeeTable";
import { ListLayout } from "../components/templates/ListLayout";
import { useEmployees } from "../features/employees/hooks/useEmployees";
import { EmployeeStats } from "../features/employees/components/EmployeeStats";
import {
  EmployeeFilters,
  type EmployeeStatusFilter,
} from "../features/employees/components/EmployeeFilters";
import { useEmployeeFormOptions } from "../features/employees/hooks/useEmployeeFormOptions";
import { useCreateEmployee } from "../features/employees/hooks/useCreateEmployee";

export function EmployeesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<EmployeeStatusFilter>("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    employees,
    isLoading,
    isError,
  } = useEmployees();

  const {
    branches,
    branchesLoading,
    branchesError,
    departments,
    departmentsLoading,
    departmentsError,
  } = useEmployeeFormOptions();

  const { createEmployeeMutation } = useCreateEmployee({
    onSuccess: () => setShowCreateForm(false),
  });

  const availableBranches = Array.from(
    new Map(
      employees.map((employee) => [
        employee.branch.id,
        employee.branch,
      ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const availableDepartments = Array.from(
    new Map(
      employees
        .filter((employee) => employee.department)
        .map((employee) => [
          employee.department!.id,
          employee.department!,
        ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const normalizedSearch = search.trim().toLowerCase();

  const filteredEmployees = employees.filter((employee) => {
    if (statusFilter !== "ALL" && employee.status !== statusFilter) {
      return false;
    }

    if (branchFilter !== "ALL" && employee.branch.id !== branchFilter) {
      return false;
    }

    if (
      departmentFilter !== "ALL" &&
      employee.department?.id !== departmentFilter
    ) {
      return false;
    }

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
        title={t("employees.title")}
        description={t("employees.description")}
        searchValue={search}
        searchPlaceholder={t("employees.searchPlaceholder")}
        onSearchChange={setSearch}
        actions={
          <Button
            type="button"
            onClick={() =>
              setShowCreateForm((current) => !current)
            }
          >
            {showCreateForm
              ? t("common.cancel")
              : t("employees.newEmployee")}
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
                    aria-label={t("employees.formDataLoading")}
                  />
                </div>
              )}

              {formDataError && (
                <div role="alert" className="alert alert-error">
                  {t("employees.formDataError")}
                </div>
              )}

              {!formDataLoading && !formDataError && (
                <EmployeeForm
                  branches={branches}
                  departments={departments}
                  loading={createEmployeeMutation.isPending}
                  onSubmit={(data) =>
                    createEmployeeMutation.mutate(data)
                  }
                />
              )}

              {createEmployeeMutation.isError && (
                <div
                  role="alert"
                  className="alert alert-error mt-4"
                >
                  {t("employees.createError")}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-center py-12">
            <span
              className="loading loading-spinner loading-lg"
              aria-label={t("employees.loading")}
            />
          </div>
        )}

        {isError && (
          <div role="alert" className="alert alert-error">
            {t("employees.loadError")}
          </div>
        )}

        {!isLoading && !isError && (
          <EmployeeStats employees={employees} />
        )}

        {!isLoading && !isError && (
          <div className="mb-6">
            <EmployeeFilters
              status={statusFilter}
              branchId={branchFilter}
              departmentId={departmentFilter}
              branches={availableBranches}
              departments={availableDepartments}
              onStatusChange={setStatusFilter}
              onBranchChange={setBranchFilter}
              onDepartmentChange={setDepartmentFilter}
              onReset={() => {
                setStatusFilter("ALL");
                setBranchFilter("ALL");
                setDepartmentFilter("ALL");
                setSearch("");
              }}
            />
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
