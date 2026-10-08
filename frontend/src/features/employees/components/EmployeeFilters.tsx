import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

export type EmployeeStatusFilter =
  | "ALL"
  | "ACTIVE"
  | "INACTIVE"
  | "ON_LEAVE"
  | "SUSPENDED";

type FilterOption = {
  id: string;
  name: string;
};

type EmployeeFiltersProps = {
  status: EmployeeStatusFilter;
  branchId: string;
  departmentId: string;
  branches: FilterOption[];
  departments: FilterOption[];
  onStatusChange: (value: EmployeeStatusFilter) => void;
  onBranchChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onReset: () => void;
};

export function EmployeeFilters({
  status,
  branchId,
  departmentId,
  branches,
  departments,
  onStatusChange,
  onBranchChange,
  onDepartmentChange,
  onReset,
}: EmployeeFiltersProps) {
  const { t } = useTranslation();

  const statuses: Exclude<EmployeeStatusFilter, "ALL">[] = [
    "ACTIVE",
    "INACTIVE",
    "ON_LEAVE",
    "SUSPENDED",
  ];

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-primary" />
        <h2 className="font-semibold">
          {t("employees.filters.title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("employees.filters.status")}
          </span>
          <select
            className="select select-bordered w-full"
            name="employee-status-filter"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as EmployeeStatusFilter)
            }
          >
            <option value="ALL">
              {t("employees.filters.allStatuses")}
            </option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {t(`employees.statuses.${item}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("employees.filters.branch")}
          </span>
          <select
            className="select select-bordered w-full"
            name="employee-branch-filter"
            value={branchId}
            onChange={(event) => onBranchChange(event.target.value)}
          >
            <option value="ALL">
              {t("employees.filters.allBranches")}
            </option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("employees.filters.department")}
          </span>
          <select
            className="select select-bordered w-full"
            name="employee-department-filter"
            value={departmentId}
            onChange={(event) =>
              onDepartmentChange(event.target.value)
            }
          >
            <option value="ALL">
              {t("employees.filters.allDepartments")}
            </option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btn btn-outline gap-2"
          onClick={onReset}
        >
          <RotateCcw size={16} />
          {t("employees.filters.reset")}
        </button>
      </div>
    </div>
  );
}
