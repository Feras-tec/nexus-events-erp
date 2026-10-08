import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../components/atoms/Button";
import { useEquipmentLifecycle } from "../hooks/useEquipmentLifecycle";
import type { EquipmentDetail } from "../types/equipment.types";

type EquipmentLifecycleProps = {
  equipmentId: string;
  equipment: EquipmentDetail;
  activeReservation: { id: string } | null;
};

export function EquipmentLifecycle({
  equipmentId,
  equipment,
  activeReservation,
}: EquipmentLifecycleProps) {
  const { t } = useTranslation();
  const {
    reportLostMutation,
    recoverLostMutation,
    retireEquipmentMutation,
  } = useEquipmentLifecycle({
    equipmentId,
    equipment,
    activeReservation,
  });

  if (
    ["AVAILABLE", "IN_TRANSIT", "AT_EVENT", "RETURNING"].includes(
      equipment.status,
    )
  ) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-box border border-error/30 bg-base-100 p-6 lg:col-span-2"
      >
        <h2 className="text-lg font-semibold">{t("equipment.lifecycle.reportLostTitle")}</h2>

        <p className="mt-1 text-sm text-base-content/60">
          {t("equipment.lifecycle.reportLostDescription")}
        </p>

        <div className="mt-5">
          <Button
            type="button"
            disabled={reportLostMutation.isPending}
            onClick={() => {
              if (window.confirm(t("equipment.lifecycle.confirmLost"))) {
                reportLostMutation.mutate();
              }
            }}
          >
            {reportLostMutation.isPending
              ? t("equipment.lifecycle.reporting")
              : t("equipment.lifecycle.reportLost")}
          </Button>
        </div>

        {reportLostMutation.isError && (
          <div className="alert alert-error mt-4">
            {reportLostMutation.error instanceof Error
              ? reportLostMutation.error.message
              : t("equipment.lifecycle.reportLostError")}
          </div>
        )}
      </motion.section>
    );
  }

  if (equipment.status === "LOST") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-box border border-error/40 bg-base-100 p-6 lg:col-span-2"
      >
        <h2 className="text-lg font-semibold">
          {t("equipment.lifecycle.lostTitle")}
        </h2>

        <p className="mt-1 text-sm text-base-content/60">
          {t("equipment.lifecycle.lostDescription")}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={
              recoverLostMutation.isPending ||
              retireEquipmentMutation.isPending
            }
            onClick={() => recoverLostMutation.mutate()}
          >
            {recoverLostMutation.isPending
              ? t("equipment.lifecycle.recovering")
              : t("equipment.lifecycle.recovered")}
          </Button>

          <Button
            type="button"
            disabled={
              recoverLostMutation.isPending ||
              retireEquipmentMutation.isPending
            }
            onClick={() => {
              if (
                window.confirm(
                  t("equipment.lifecycle.confirmRetire"),
                )
              ) {
                retireEquipmentMutation.mutate();
              }
            }}
          >
            {retireEquipmentMutation.isPending
              ? t("equipment.lifecycle.retiring")
              : t("equipment.lifecycle.retire")}
          </Button>
        </div>

        {recoverLostMutation.isError && (
          <div className="alert alert-error mt-4">
            {recoverLostMutation.error instanceof Error
              ? recoverLostMutation.error.message
              : t("equipment.lifecycle.recoverError")}
          </div>
        )}

        {retireEquipmentMutation.isError && (
          <div className="alert alert-error mt-4">
            {retireEquipmentMutation.error instanceof Error
              ? retireEquipmentMutation.error.message
              : t("equipment.lifecycle.retireError")}
          </div>
        )}
      </motion.section>
    );
  }

  return null;
}
