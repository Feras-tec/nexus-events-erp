import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/atoms/Button";
import type { EquipmentMovement } from "../types/equipment.types";
import { useEquipmentReservations } from "../hooks/useEquipmentReservations";
import { useEquipmentReservationMovement } from "../hooks/useEquipmentReservationMovement";

type EquipmentReservationStartProps = {
  equipmentId: string;
  movements: EquipmentMovement[];
};

export function EquipmentReservationStart({
  equipmentId,
  movements,
}: EquipmentReservationStartProps) {
  const { t, i18n } = useTranslation();

  const locale =
    i18n.resolvedLanguage === "ar"
      ? "ar"
      : i18n.resolvedLanguage === "en"
        ? "en-GB"
        : "de-DE";

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  const {
    data: reservations = [],
    isLoading: reservationsLoading,
  } = useEquipmentReservations();

  const { createMovementMutation } = useEquipmentReservationMovement({
    equipmentId,
  });

  const equipmentReservations = reservations.filter(
    (reservation) =>
      reservation.inventoryItem.id === equipmentId &&
      reservation.status !== "CANCELLED" &&
      !movements.some(
        (movement) =>
          movement.type === "RESERVED" &&
          movement.reservation?.id === reservation.id,
      ),
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
    >
      <h2 className="text-lg font-semibold">{t("equipment.actions.newMovement")}</h2>

      <p className="mt-1 text-sm text-base-content/60">
        {t("equipment.reservationStart.description")}
      </p>

      {reservationsLoading ? (
        <div className="mt-5">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : equipmentReservations.length === 0 ? (
        <div className="alert mt-5">
          {t("equipment.reservationStart.empty")}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {equipmentReservations.map((reservation) => (
            <div
              key={reservation.id}
              className="flex flex-col gap-4 rounded-box border border-base-300 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-semibold">
                  {reservation.event.eventNo} · {reservation.event.name}
                </div>

                <div className="mt-1 text-sm text-base-content/60">
                  {formatDateTime(reservation.startDate)}
                  {" – "}
                  {formatDateTime(reservation.endDate)}
                </div>

                <div className="mt-1 text-sm">
                  {t("equipment.reservationStart.status")}:{" "}
                  {t(`status.${reservation.status}`, {
                    defaultValue: reservation.status.replaceAll("_", " "),
                  })}
                </div>
              </div>

              <Button
                type="button"
                loading={createMovementMutation.isPending}
                disabled={
                  createMovementMutation.isPending ||
                  reservation.status !== "CONFIRMED"
                }
                onClick={() =>
                  createMovementMutation.mutate(reservation.id)
                }
              >
                {t("equipment.reservationStart.reserve")}
              </Button>
            </div>
          ))}
        </div>
      )}

      {createMovementMutation.isError && (
        <div role="alert" className="alert alert-error mt-4">
          {t("equipment.reservationStart.saveError")}
        </div>
      )}
    </motion.section>
  );
}
