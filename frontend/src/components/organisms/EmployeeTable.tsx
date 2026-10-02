import { StatusChip } from "../atoms/StatusChip";

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

type EmployeeTableProps = {
  employees: Employee[];
  onView?: (employeeId: string) => void;
};

export function EmployeeTable({
  employees,
  onView,
}: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <div className="rounded-box border border-base-300 bg-base-100 p-8 text-center">
        <p className="text-base-content/60">
          Keine Mitarbeiter gefunden.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table className="table">
        <thead>
          <tr>
            <th>Mitarbeiter</th>
            <th>Position</th>
            <th>Abteilung</th>
            <th>Niederlassung</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Aktionen</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>
                <div>
                  <div className="font-medium">
                    {employee.firstName} {employee.lastName}
                  </div>

                  <div className="text-xs text-base-content/60">
                    {employee.employeeNo}
                  </div>

                  {employee.email && (
                    <div className="text-xs text-base-content/60">
                      {employee.email}
                    </div>
                  )}
                </div>
              </td>

              <td>{employee.position ?? "—"}</td>

              <td>{employee.department?.name ?? "—"}</td>

              <td>{employee.branch.name}</td>

              <td>
                <StatusChip status={employee.status} />
              </td>

              <td className="text-right">
                {onView && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onView(employee.id)}
                  >
                    Anzeigen
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
