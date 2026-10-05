import { motion } from "motion/react";

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
        <h2 className="text-lg font-semibold">Verlust melden</h2>

        <p className="mt-1 text-sm text-base-content/60">
          Wenn das Gerät nicht mehr auffindbar ist, kann es als verloren
          gemeldet werden.
        </p>

        <div className="mt-5">
          <Button
            type="button"
            disabled={reportLostMutation.isPending}
            onClick={() => {
              if (window.confirm("Gerät wirklich als verloren melden?")) {
                reportLostMutation.mutate();
              }
            }}
          >
            {reportLostMutation.isPending
              ? "Wird gemeldet..."
              : "Als verloren melden"}
          </Button>
        </div>

        {reportLostMutation.isError && (
          <div className="alert alert-error mt-4">
            {reportLostMutation.error instanceof Error
              ? reportLostMutation.error.message
              : "Gerät konnte nicht als verloren gemeldet werden."}
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
          Gerät als verloren gemeldet
        </h2>

        <p className="mt-1 text-sm text-base-content/60">
          Das Gerät ist derzeit als verloren registriert. Es kann als
          wiedergefunden markiert oder dauerhaft ausgemustert werden.
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
              ? "Wird zurückgeführt..."
              : "Wiedergefunden"}
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
                  "Gerät wirklich dauerhaft ausmustern? Dieser Status kann nicht rückgängig gemacht werden.",
                )
              ) {
                retireEquipmentMutation.mutate();
              }
            }}
          >
            {retireEquipmentMutation.isPending
              ? "Wird ausgemustert..."
              : "Ausmustern"}
          </Button>
        </div>

        {recoverLostMutation.isError && (
          <div className="alert alert-error mt-4">
            {recoverLostMutation.error instanceof Error
              ? recoverLostMutation.error.message
              : "Gerät konnte nicht zurückgeführt werden."}
          </div>
        )}

        {retireEquipmentMutation.isError && (
          <div className="alert alert-error mt-4">
            {retireEquipmentMutation.error instanceof Error
              ? retireEquipmentMutation.error.message
              : "Gerät konnte nicht ausgemustert werden."}
          </div>
        )}
      </motion.section>
    );
  }

  return null;
}
