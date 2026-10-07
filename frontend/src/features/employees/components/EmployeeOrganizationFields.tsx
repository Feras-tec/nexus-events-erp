import { useTranslation } from "react-i18next";

import type {
  BranchOption,
  DepartmentOption,
  EmployeeFormValues,
} from "../types/employee-form.types";

type EmployeeOrganizationFieldsProps = {
  mode: "create" | "edit";
  loading: boolean;
  values: EmployeeFormValues;
  activeBranches: BranchOption[];
  availableDepartments: DepartmentOption[];
  onBranchChange: (branchId: string) => void;
  onDepartmentChange: (departmentId: string) => void;
};

export function EmployeeOrganizationFields({
  mode,
  loading,
  values,
  activeBranches,
  availableDepartments,
  onBranchChange,
  onDepartmentChange,
}: EmployeeOrganizationFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          {t("employees.form.branch")}
        </legend>

        <select
          className="select w-full"
          value={values.branchId}
          onChange={(event) =>
            onBranchChange(event.target.value)
          }
          disabled={mode === "edit" || loading}
          required
        >
          <option value="">
            {t("employees.form.selectBranch")}
          </option>

          {activeBranches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} – {branch.city}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="fieldset md:col-span-2">
        <legend className="fieldset-legend">
          {t("employees.form.department")}
        </legend>

        <select
          className="select w-full"
          value={values.departmentId}
          onChange={(event) =>
            onDepartmentChange(event.target.value)
          }
          disabled={!values.branchId || loading}
        >
          <option value="">
            {t("employees.form.noDepartment")}
          </option>

          {availableDepartments.map((department) => (
            <option
              key={department.id}
              value={department.id}
            >
              {department.name}
            </option>
          ))}
        </select>
      </fieldset>
    </>
  );
}
