import { Button } from "../../../components/atoms/Button";

import type { EquipmentMovement } from "../types/equipment.types";

type ActiveReservation = NonNullable<EquipmentMovement["reservation"]>;

type Employee = {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  position?: string | null;
};

type EquipmentPackedActionProps = {
  activeReservation: ActiveReservation | null;
  employees: Employee[];
  employeesLoading: boolean;
  employeesError: boolean;
  responsibleEmployeeId: string;
  markLoadedPending: boolean;
  markLoadedError: boolean;
  onEmployeeChange: (employeeId: string) => void;
  onMarkLoaded: () => void;
};

export function EquipmentPackedAction({
  activeReservation,
  employees,
  employeesLoading,
  employeesError,
  responsibleEmployeeId,
  markLoadedPending,
  markLoadedError,
  onEmployeeChange,
  onMarkLoaded,
}: EquipmentPackedActionProps) {
  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2">
      <h2 className="text-lg font-semibold">
        Neue Bewegung
      </h2>

      <p className="mt-1 text-sm text-base-content/60">
        Gepacktes Gerät für den Transport zum Event verladen.
      </p>

      {activeReservation ? (
        <div className="mt-5 rounded-box border border-base-300 p-4">
          <div className="font-semibold">
            {activeReservation.event.eventNo} ·{" "}
            {activeReservation.event.name}
          </div>

          <div className="mt-4">
            <label
              className="label"
              htmlFor="responsibleEmployee"
            >
              Verantwortlicher Mitarbeiter
            </label>

            <select
              id="responsibleEmployee"
              className="select select-bordered w-full"
              value={responsibleEmployeeId}
              onChange={(event) =>
                onEmployeeChange(event.target.value)
              }
              disabled={
                employeesLoading || markLoadedPending
              }
            >
              <option value="">
                Mitarbeiter auswählen
              </option>

              {employees.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.employeeNo} –{" "}
                  {employee.firstName}{" "}
                  {employee.lastName}
                  {employee.position
                    ? ` – ${employee.position}`
                    : ""}
                </option>
              ))}
            </select>

            {employeesError && (
              <div className="alert alert-error mt-3">
                Mitarbeiter konnten nicht geladen werden.
              </div>
            )}
          </div>

          <Button
            type="button"
            className="mt-4"
            loading={markLoadedPending}
            disabled={
              markLoadedPending ||
              employeesLoading ||
              !responsibleEmployeeId
            }
            onClick={onMarkLoaded}
          >
            Als verladen markieren
          </Button>
        </div>
      ) : (
        <div className="alert alert-warning mt-5">
          Keine verknüpfte Reservierung gefunden.
        </div>
      )}

      {markLoadedError && (
        <div className="alert alert-error mt-4">
          Gerät konnte nicht als verladen markiert werden.
        </div>
      )}
    </section>
  );
}
