import type {
  EquipmentDetail,
  EquipmentMovement,
} from "../types/equipment.types";
import { useEquipmentEventWorkflow } from "../hooks/useEquipmentEventWorkflow";
import { useEquipmentLegacyRecovery } from "../hooks/useEquipmentLegacyRecovery";
import { useEquipmentEmployees } from "../hooks/useEquipmentEmployees";
import { useState } from "react";
import { motion } from "motion/react";

import { Button } from "../../../components/atoms/Button";

type ActiveReservation = NonNullable<EquipmentMovement["reservation"]>;

type EquipmentEventWorkflowProps = {
  equipmentId: string;
  equipment: EquipmentDetail;
  activeReservation: ActiveReservation | null;
};

export function EquipmentEventWorkflow({
  equipmentId,
  equipment,
  activeReservation,
}: EquipmentEventWorkflowProps) {
  const [responsibleEmployeeId, setResponsibleEmployeeId] = useState("");

  const {
    data: employees = [],
    isLoading: employeesLoading,
    isError: employeesError,
  } = useEquipmentEmployees();
  const {
    startPickingMutation,
    markPackedMutation,
    markLoadedMutation,
    markDeliveredMutation,
    startReturnMutation,
    startInspectionMutation,
  } = useEquipmentEventWorkflow({
    equipmentId,
    equipment,
    activeReservation,
    responsibleEmployeeId,
  });

  const { legacyPickingResetMutation } = useEquipmentLegacyRecovery({
    equipmentId,
    equipment,
    activeReservation,
  });


  if (equipment.status === "RETURNING") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
      >
        <h2 className="text-lg font-semibold">Neue Bewegung</h2>

        <p className="mt-1 text-sm text-base-content/60">
          Zurückgekehrtes Gerät zur Prüfung übergeben.
        </p>

        {activeReservation ? (
          <div className="mt-5 rounded-box border border-base-300 p-4">
            <div className="font-semibold">
              {activeReservation.event.eventNo} · {activeReservation.event.name}
            </div>

            <Button
              type="button"
              className="mt-4"
              loading={startInspectionMutation.isPending}
              disabled={startInspectionMutation.isPending}
              onClick={() => startInspectionMutation.mutate()}
            >
              Prüfung starten
            </Button>
          </div>
        ) : (
          <div className="alert alert-warning mt-5">
            Keine verknüpfte Reservierung gefunden.
          </div>
        )}

        {startInspectionMutation.isError && (
          <div className="alert alert-error mt-4">
            Geräteprüfung konnte nicht gestartet werden.
          </div>
        )}
      </motion.section>
    );
  }

  if (equipment.status === "AT_EVENT") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
      >
        <h2 className="text-lg font-semibold">Neue Bewegung</h2>

        <p className="mt-1 text-sm text-base-content/60">
          Rücktransport des Geräts vom Event starten.
        </p>

        {activeReservation ? (
          <div className="mt-5 rounded-box border border-base-300 p-4">
            <div className="font-semibold">
              {activeReservation.event.eventNo} · {activeReservation.event.name}
            </div>

            <Button
              type="button"
              className="mt-4"
              loading={startReturnMutation.isPending}
              disabled={startReturnMutation.isPending}
              onClick={() => startReturnMutation.mutate()}
            >
              Rücktransport starten
            </Button>
          </div>
        ) : (
          <div className="alert alert-warning mt-5">
            Keine verknüpfte Reservierung gefunden.
          </div>
        )}

        {startReturnMutation.isError && (
          <div className="alert alert-error mt-4">
            Rücktransport konnte nicht gestartet werden.
          </div>
        )}
      </motion.section>
    );
  }

  if (equipment.status === "IN_TRANSIT") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
      >
        <h2 className="text-lg font-semibold">Neue Bewegung</h2>

        <p className="mt-1 text-sm text-base-content/60">
          Ankunft des Geräts am Event bestätigen.
        </p>

        {activeReservation ? (
          <div className="mt-5 rounded-box border border-base-300 p-4">
            <div className="font-semibold">
              {activeReservation.event.eventNo} · {activeReservation.event.name}
            </div>

            <Button
              type="button"
              className="mt-4"
              loading={markDeliveredMutation.isPending}
              disabled={markDeliveredMutation.isPending}
              onClick={() => markDeliveredMutation.mutate()}
            >
              Am Event angekommen
            </Button>
          </div>
        ) : (
          <div className="alert alert-warning mt-5">
            Keine verknüpfte Reservierung gefunden.
          </div>
        )}

        {markDeliveredMutation.isError && (
          <div className="alert alert-error mt-4">
            Ankunft am Event konnte nicht gespeichert werden.
          </div>
        )}
      </motion.section>
    );
  }

  if (equipment.status === "PACKED") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
      >
        <h2 className="text-lg font-semibold">Neue Bewegung</h2>

        <p className="mt-1 text-sm text-base-content/60">
          Gepacktes Gerät für den Transport zum Event verladen.
        </p>

        {activeReservation ? (
          <div className="mt-5 rounded-box border border-base-300 p-4">
            <div className="font-semibold">
              {activeReservation.event.eventNo} · {activeReservation.event.name}
            </div>

            <div className="mt-4">
              <label className="label" htmlFor="responsibleEmployee">
                Verantwortlicher Mitarbeiter
              </label>

              <select
                id="responsibleEmployee"
                className="select select-bordered w-full"
                value={responsibleEmployeeId}
                onChange={(event) =>
                  setResponsibleEmployeeId(event.target.value)
                }
                disabled={employeesLoading || markLoadedMutation.isPending}
              >
                <option value="">Mitarbeiter auswählen</option>

                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employeeNo} – {employee.firstName}{" "}
                    {employee.lastName}
                    {employee.position ? ` – ${employee.position}` : ""}
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
              loading={markLoadedMutation.isPending}
              disabled={
                markLoadedMutation.isPending ||
                employeesLoading ||
                !responsibleEmployeeId
              }
              onClick={() => markLoadedMutation.mutate()}
            >
              Als verladen markieren
            </Button>
          </div>
        ) : (
          <div className="alert alert-warning mt-5">
            Keine verknüpfte Reservierung gefunden.
          </div>
        )}

        {markLoadedMutation.isError && (
          <div className="alert alert-error mt-4">
            Gerät konnte nicht als verladen markiert werden.
          </div>
        )}
      </motion.section>
    );
  }

  if (equipment.status === "PICKING") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
      >
        <h2 className="text-lg font-semibold">Neue Bewegung</h2>

        <p className="mt-1 text-sm text-base-content/60">
          Kommissioniertes Gerät als gepackt markieren.
        </p>

        {activeReservation ? (
          <div className="mt-5 rounded-box border border-base-300 p-4">
            <div className="font-semibold">
              {activeReservation.event.eventNo} · {activeReservation.event.name}
            </div>

            <Button
              type="button"
              className="mt-4"
              loading={markPackedMutation.isPending}
              disabled={markPackedMutation.isPending}
              onClick={() => markPackedMutation.mutate()}
            >
              Als gepackt markieren
            </Button>
          </div>
        ) : (
          <div className="mt-5 rounded-box border border-warning bg-warning/10 p-4">
            <div className="font-semibold">
              Keine verknüpfte Reservierung gefunden.
            </div>

            <p className="mt-2 text-sm text-base-content/70">
              Dieses Gerät enthält eine ältere PICKING-Bewegung ohne
              Reservierungsverknüpfung. Der Status kann sicher auf AVAILABLE
              zurückgesetzt werden.
            </p>

            <Button
              type="button"
              className="mt-4"
              loading={legacyPickingResetMutation.isPending}
              disabled={legacyPickingResetMutation.isPending}
              onClick={() => legacyPickingResetMutation.mutate()}
            >
              Legacy-Daten korrigieren
            </Button>

            {legacyPickingResetMutation.isError && (
              <div className="alert alert-error mt-4">
                Datenkorrektur konnte nicht durchgeführt werden.
              </div>
            )}
          </div>
        )}

        {markPackedMutation.isError && (
          <div className="alert alert-error mt-4">
            Gerät konnte nicht als gepackt markiert werden.
          </div>
        )}
      </motion.section>
    );
  }

  if (equipment.status === "RESERVED") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
      >
        <h2 className="text-lg font-semibold">Neue Bewegung</h2>

        <p className="mt-1 text-sm text-base-content/60">
          Reserviertes Gerät für die Kommissionierung vorbereiten.
        </p>

        {activeReservation ? (
          <div className="mt-5 rounded-box border border-base-300 p-4">
            <div className="font-semibold">
              {activeReservation.event.eventNo} · {activeReservation.event.name}
            </div>

            <Button
              type="button"
              className="mt-4"
              loading={startPickingMutation.isPending}
              disabled={startPickingMutation.isPending}
              onClick={() => startPickingMutation.mutate()}
            >
              Kommissionierung starten
            </Button>
          </div>
        ) : (
          <div className="alert alert-warning mt-5">
            Keine verknüpfte Reservierung gefunden.
          </div>
        )}

        {startPickingMutation.isError && (
          <div className="alert alert-error mt-4">
            Kommissionierung konnte nicht gestartet werden.
          </div>
        )}
      </motion.section>
    );
  }

  return null;
}
