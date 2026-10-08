import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../components/atoms/Button";
import { useEquipmentInspection } from "../hooks/useEquipmentInspection";
import type {
  EquipmentDetail,
  EquipmentMovement,
} from "../types/equipment.types";

type ActiveReservation = NonNullable<EquipmentMovement["reservation"]>;

type EquipmentInspectionProps = {
  equipmentId: string;
  equipment: EquipmentDetail;
  activeReservation: ActiveReservation | null;
};

export function EquipmentInspection({
  equipmentId,
  equipment,
  activeReservation,
}: EquipmentInspectionProps) {
  const { t } = useTranslation();
  const { completeInspectionMutation } = useEquipmentInspection({
    equipmentId,
    equipment,
    activeReservation,
  });

  const isPending = completeInspectionMutation.isPending;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
    >
      <h2 className="text-lg font-semibold">{t("equipment.inspection.title")}</h2>

      <p className="mt-1 text-sm text-base-content/60">
        {t("equipment.inspection.description")}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => completeInspectionMutation.mutate("AVAILABLE")}
        >
          {t("equipment.inspection.available")}
        </Button>

        <Button
          type="button"
          disabled={isPending}
          onClick={() => completeInspectionMutation.mutate("DAMAGED")}
        >
          {t("equipment.inspection.damaged")}
        </Button>

        <Button
          type="button"
          disabled={isPending}
          onClick={() => completeInspectionMutation.mutate("MAINTENANCE")}
        >
          {t("equipment.inspection.maintenance")}
        </Button>
      </div>

      {completeInspectionMutation.isError && (
        <div className="alert alert-error mt-4">
          {t("equipment.inspection.saveError")}
        </div>
      )}
    </motion.section>
  );
}
