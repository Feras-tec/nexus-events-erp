import { motion } from "motion/react";

import type { EquipmentMovement } from "../types/equipment.types";

type EquipmentMovementHistoryProps = {
  movements: EquipmentMovement[];
  isLoading: boolean;
  isError: boolean;
};

export function EquipmentMovementHistory({
  movements,
  isLoading,
  isError,
}: EquipmentMovementHistoryProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Bewegungshistorie</h2>
        <p className="text-sm text-base-content/60">
          Status- und Gerätebewegungen
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md" />
        </div>
      )}

      {isError && (
        <div role="alert" className="alert alert-error">
          Bewegungshistorie konnte nicht geladen werden.
        </div>
      )}

      {!isLoading && !isError && movements.length === 0 && (
        <div className="rounded-box bg-base-200 p-5 text-sm text-base-content/60">
          Noch keine Gerätebewegungen vorhanden.
        </div>
      )}

      {!isLoading && !isError && movements.length > 0 && (
        <div className="space-y-3">
          {movements.map((movement) => (
            <div
              key={movement.id}
              className="rounded-box border border-base-300 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{movement.type}</div>

                  <div className="mt-1 text-sm text-base-content/60">
                    {movement.fromStatus ?? "—"} → {movement.toStatus}
                  </div>
                </div>

                <div className="text-sm text-base-content/60">
                  {new Intl.DateTimeFormat("de-DE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(movement.createdAt))}
                </div>
              </div>

              {(movement.fromLocation || movement.toLocation) && (
                <div className="mt-3 text-sm">
                  Standort: {movement.fromLocation ?? "—"} →{" "}
                  {movement.toLocation ?? "—"}
                </div>
              )}

              {(movement.fromWarehouse || movement.toWarehouse) && (
                <div className="mt-2 text-sm">
                  Lager:{" "}
                  <span className="font-medium">
                    {movement.fromWarehouse?.name ?? "—"} →{" "}
                    {movement.toWarehouse?.name ?? "—"}
                  </span>
                </div>
              )}

              {movement.reservation?.event && (
                <div className="mt-3 rounded-box bg-base-200 p-3 text-sm">
                  Event:{" "}
                  <span className="font-medium">
                    {movement.reservation.event.eventNo} ·{" "}
                    {movement.reservation.event.name}
                  </span>
                </div>
              )}

              {movement.responsibleEmployee && (
                <div className="mt-2 text-sm">
                  Verantwortlich:{" "}
                  <span className="font-medium">
                    {movement.responsibleEmployee.firstName}{" "}
                    {movement.responsibleEmployee.lastName}
                  </span>
                </div>
              )}

              {movement.notes && (
                <p className="mt-2 text-sm text-base-content/70">
                  {movement.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
