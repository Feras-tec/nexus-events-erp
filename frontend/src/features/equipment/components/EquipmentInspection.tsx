import { motion } from "motion/react";

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
      <h2 className="text-lg font-semibold">Prüfung abschließen</h2>

      <p className="mt-1 text-sm text-base-content/60">
        Ergebnis der Geräteprüfung auswählen.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => completeInspectionMutation.mutate("AVAILABLE")}
        >
          Einsatzbereit
        </Button>

        <Button
          type="button"
          disabled={isPending}
          onClick={() => completeInspectionMutation.mutate("DAMAGED")}
        >
          Beschädigt
        </Button>

        <Button
          type="button"
          disabled={isPending}
          onClick={() => completeInspectionMutation.mutate("MAINTENANCE")}
        >
          Wartung erforderlich
        </Button>
      </div>

      {completeInspectionMutation.isError && (
        <div className="alert alert-error mt-4">
          Prüfergebnis konnte nicht gespeichert werden.
        </div>
      )}
    </motion.section>
  );
}
