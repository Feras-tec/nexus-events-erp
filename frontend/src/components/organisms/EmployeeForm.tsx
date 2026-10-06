import { useEffect, useMemo, useState, type FormEvent } from "react";

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
            Mitarbeiternummer
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
          <legend className="fieldset-legend">Status</legend>
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
            <option value="ACTIVE">Aktiv</option>
            <option value="INACTIVE">Inaktiv</option>
            <option value="ON_LEAVE">Beurlaubt</option>
            <option value="SUSPENDED">Suspendiert</option>
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
            ? "Wird gespeichert..."
            : mode === "edit"
              ? "Änderungen speichern"
              : "Mitarbeiter erstellen"}
        </button>
      </div>
    </form>
  );
}
