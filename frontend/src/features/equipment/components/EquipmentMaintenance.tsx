import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../components/atoms/Button";
import { useEquipmentMaintenance } from "../hooks/useEquipmentMaintenance";
import type { EquipmentDetail } from "../types/equipment.types";

type EquipmentMaintenanceProps = {
  equipmentId: string;
  equipment: EquipmentDetail;
};

export function EquipmentMaintenance({
  equipmentId,
  equipment,
}: EquipmentMaintenanceProps) {
  const { t } = useTranslation();
  const {
    startMaintenanceMutation,
    completeRepairMutation,
    returnRepairedToAvailableMutation,
  } = useEquipmentMaintenance({
    equipmentId,
    equipment,
  });

  if (equipment.status === "REPAIRED") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-box border border-success/30 bg-base-100 p-6 lg:col-span-2"
      >
        <h2 className="text-lg font-semibold">{t("equipment.maintenance.repairedTitle")}</h2>

        <p className="mt-1 text-sm text-base-content/60">
          {t("equipment.maintenance.repairedDescription")}
        </p>

        <div className="mt-5">
          <Button
            type="button"
            disabled={returnRepairedToAvailableMutation.isPending}
            onClick={() => returnRepairedToAvailableMutation.mutate()}
          >
            {returnRepairedToAvailableMutation.isPending
              ? t("equipment.maintenance.releasing")
              : t("equipment.maintenance.release")}
          </Button>
        </div>

        {returnRepairedToAvailableMutation.isError && (
          <div className="alert alert-error mt-4">
            {returnRepairedToAvailableMutation.error instanceof Error
              ? returnRepairedToAvailableMutation.error.message
              : t("equipment.maintenance.releaseError")}
          </div>
        )}
      </motion.section>
    );
  }

  if (equipment.status === "MAINTENANCE") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-box border border-warning/30 bg-base-100 p-6 lg:col-span-2"
      >
        <h2 className="text-lg font-semibold">{t("equipment.maintenance.inMaintenanceTitle")}</h2>

        <p className="mt-1 text-sm text-base-content/60">
          {t("equipment.maintenance.inMaintenanceDescription")}
        </p>

        <div className="mt-5">
          <Button
            type="button"
            disabled={completeRepairMutation.isPending}
            onClick={() => completeRepairMutation.mutate()}
          >
            {completeRepairMutation.isPending
              ? t("equipment.maintenance.completing")
              : t("equipment.maintenance.completeRepair")}
          </Button>
        </div>

        {completeRepairMutation.isError && (
          <div className="alert alert-error mt-4">
            {completeRepairMutation.error instanceof Error
              ? completeRepairMutation.error.message
              : t("equipment.maintenance.completeError")}
          </div>
        )}
      </motion.section>
    );
  }

  if (equipment.status === "DAMAGED") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-box border border-error/30 bg-base-100 p-6 lg:col-span-2"
      >
        <h2 className="text-lg font-semibold">{t("equipment.maintenance.damagedTitle")}</h2>

        <p className="mt-1 text-sm text-base-content/60">
          {t("equipment.maintenance.damagedDescription")}
        </p>

        <div className="mt-5">
          <Button
            type="button"
            disabled={startMaintenanceMutation.isPending}
            onClick={() => startMaintenanceMutation.mutate()}
          >
            {startMaintenanceMutation.isPending
              ? t("equipment.maintenance.transferring")
              : t("equipment.maintenance.sendToMaintenance")}
          </Button>
        </div>

        {startMaintenanceMutation.isError && (
          <div className="alert alert-error mt-4">
            {startMaintenanceMutation.error instanceof Error
              ? startMaintenanceMutation.error.message
              : t("equipment.maintenance.transferError")}
          </div>
        )}
      </motion.section>
    );
  }

  return null;
}
