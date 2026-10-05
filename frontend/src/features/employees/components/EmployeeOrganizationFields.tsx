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
  return (
    <>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          Niederlassung
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
            Niederlassung auswählen
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
          Abteilung
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
            Keine Abteilung
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
