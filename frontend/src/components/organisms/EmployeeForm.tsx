import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import type {
  BranchOption,
  DepartmentOption,
  EmployeeFormValues,
} from "../../features/employees/types/employee-form.types";
import { EmployeeOrganizationFields } from "../../features/employees/components/EmployeeOrganizationFields";
import { EmployeePersonalFields } from "../../features/employees/components/EmployeePersonalFields";

export type {
  BranchOption,
  DepartmentOption,
  EmployeeFormValues,
} from "../../features/employees/types/employee-form.types";

type EmployeeFormProps = {
  mode?: "create" | "edit";
  branches: BranchOption[];
  departments: DepartmentOption[];
  initialValues?: Partial<EmployeeFormValues>;
  loading?: boolean;
  onSubmit: (values: EmployeeFormValues) => void;
};

const emptyValues: EmployeeFormValues = {
  employeeNo: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: "",
  nationality: "",
  position: "",
  branchId: "",
  departmentId: "",
  status: "ACTIVE",
};

export function EmployeeForm({
  mode = "create",
  branches,
  departments,
  initialValues,
  loading = false,
  onSubmit,
}: EmployeeFormProps) {
  const { t } = useTranslation();

  const [values, setValues] = useState<EmployeeFormValues>({
    ...emptyValues,
    ...initialValues,
  });

  useEffect(() => {
    setValues({
      ...emptyValues,
      ...initialValues,
    });
  }, [initialValues]);

  const activeBranches = useMemo(
    () =>
      branches.filter(
        (branch) =>
          branch.isActive ||
          (mode === "edit" && branch.id === values.branchId),
      ),
    [branches, mode, values.branchId],
  );

  const availableDepartments = useMemo(
    () =>
      departments.filter(
        (department) =>
          department.branchId === values.branchId &&
          (department.isActive ||
            (mode === "edit" &&
              department.id === values.departmentId)),
      ),
    [
      departments,
      mode,
      values.branchId,
      values.departmentId,
    ],
  );

  function updateField<K extends keyof EmployeeFormValues>(
    field: K,
    value: EmployeeFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleBranchChange(branchId: string) {
    setValues((current) => ({
      ...current,
      branchId,
      departmentId: "",
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">
            {t("employees.form.employeeNo")}
          </legend>

          <input
            type="text"
            className="input w-full"
            value={values.employeeNo}
            onChange={(event) =>
              updateField("employeeNo", event.target.value)
            }
            disabled={mode === "edit" || loading}
            required
            minLength={2}
            maxLength={30}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">
            {t("employees.form.status")}
          </legend>

          <select
            className="select w-full"
            value={values.status}
            onChange={(event) =>
              updateField(
                "status",
                event.target.value as EmployeeFormValues["status"],
              )
            }
            disabled={mode === "create" || loading}
          >
            <option value="ACTIVE">
              {t("status.ACTIVE")}
            </option>
            <option value="INACTIVE">
              {t("status.INACTIVE")}
            </option>
            <option value="ON_LEAVE">
              {t("status.ON_LEAVE")}
            </option>
            <option value="SUSPENDED">
              {t("status.SUSPENDED")}
            </option>
          </select>
        </fieldset>

        <EmployeePersonalFields
          values={values}
          loading={loading}
          onUpdate={updateField}
        />

        <EmployeeOrganizationFields
          mode={mode}
          loading={loading}
          values={values}
          activeBranches={activeBranches}
          availableDepartments={availableDepartments}
          onBranchChange={handleBranchChange}
          onDepartmentChange={(departmentId) =>
            updateField("departmentId", departmentId)
          }
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading
            ? t("employees.form.saving")
            : mode === "edit"
              ? t("employees.form.saveChanges")
              : t("employees.form.create")}
        </button>
      </div>
    </form>
  );
}
