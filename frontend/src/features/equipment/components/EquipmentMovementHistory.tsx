import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation();

  const locale =
    i18n.resolvedLanguage === "ar"
      ? "ar"
      : i18n.resolvedLanguage === "en"
        ? "en-GB"
        : "de-DE";

  const translateStatus = (status: string | null | undefined) =>
    status
      ? t(`status.${status}`, {
          defaultValue: status.replaceAll("_", " "),
        })
      : "—";

  const translateMovement = (type: string) =>
    t(`equipment.movements.types.${type}`, {
      defaultValue: type.replaceAll("_", " "),
    });

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold">{t("equipment.movements.title")}</h2>
        <p className="text-sm text-base-content/60">
          {t("equipment.movements.subtitle")}
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md" />
        </div>
      )}

      {isError && (
        <div role="alert" className="alert alert-error">
          {t("equipment.movements.loadError")}
        </div>
      )}

      {!isLoading && !isError && movements.length === 0 && (
        <div className="rounded-box bg-base-200 p-5 text-sm text-base-content/60">
          {t("equipment.movements.empty")}
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
                  <div className="font-semibold">{translateMovement(movement.type)}</div>

                  <div className="mt-1 text-sm text-base-content/60">
                    {translateStatus(movement.fromStatus)} → {translateStatus(movement.toStatus)}
                  </div>
                </div>

                <div className="text-sm text-base-content/60">
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(movement.createdAt))}
                </div>
              </div>

              {(movement.fromLocation || movement.toLocation) && (
                <div className="mt-3 text-sm">
                  {t("equipment.movements.location")}: {movement.fromLocation ?? "—"} →{" "}
                  {movement.toLocation ?? "—"}
                </div>
              )}

              {(movement.fromWarehouse || movement.toWarehouse) && (
                <div className="mt-2 text-sm">
                  {t("equipment.movements.warehouse")}:{" "}
                  <span className="font-medium">
                    {movement.fromWarehouse?.name ?? "—"} →{" "}
                    {movement.toWarehouse?.name ?? "—"}
                  </span>
                </div>
              )}

              {movement.reservation?.event && (
                <div className="mt-3 rounded-box bg-base-200 p-3 text-sm">
                  {t("equipment.movements.event")}:{" "}
                  <span className="font-medium">
                    {movement.reservation.event.eventNo} ·{" "}
                    {movement.reservation.event.name}
                  </span>
                </div>
              )}

              {movement.responsibleEmployee && (
                <div className="mt-2 text-sm">
                  {t("equipment.movements.responsible")}:{" "}
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
