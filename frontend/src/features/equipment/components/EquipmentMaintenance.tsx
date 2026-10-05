import { motion } from "motion/react";

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
        <h2 className="text-lg font-semibold">Reparatur abgeschlossen</h2>

        <p className="mt-1 text-sm text-base-content/60">
          Das reparierte Gerät prüfen und wieder für den Einsatz freigeben.
        </p>

        <div className="mt-5">
          <Button
            type="button"
            disabled={returnRepairedToAvailableMutation.isPending}
            onClick={() => returnRepairedToAvailableMutation.mutate()}
          >
            {returnRepairedToAvailableMutation.isPending
              ? "Wird freigegeben..."
              : "Gerät freigeben"}
          </Button>
        </div>

        {returnRepairedToAvailableMutation.isError && (
          <div className="alert alert-error mt-4">
            {returnRepairedToAvailableMutation.error instanceof Error
              ? returnRepairedToAvailableMutation.error.message
              : "Gerät konnte nicht freigegeben werden."}
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
        <h2 className="text-lg font-semibold">Gerät in Wartung</h2>

        <p className="mt-1 text-sm text-base-content/60">
          Wartung oder Reparatur des Geräts abschließen.
        </p>

        <div className="mt-5">
          <Button
            type="button"
            disabled={completeRepairMutation.isPending}
            onClick={() => completeRepairMutation.mutate()}
          >
            {completeRepairMutation.isPending
              ? "Wird abgeschlossen..."
              : "Reparatur abschließen"}
          </Button>
        </div>

        {completeRepairMutation.isError && (
          <div className="alert alert-error mt-4">
            {completeRepairMutation.error instanceof Error
              ? completeRepairMutation.error.message
              : "Reparatur konnte nicht abgeschlossen werden."}
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
        <h2 className="text-lg font-semibold">Beschädigtes Gerät</h2>

        <p className="mt-1 text-sm text-base-content/60">
          Das Gerät wurde bei der Prüfung als beschädigt eingestuft.
        </p>

        <div className="mt-5">
          <Button
            type="button"
            disabled={startMaintenanceMutation.isPending}
            onClick={() => startMaintenanceMutation.mutate()}
          >
            {startMaintenanceMutation.isPending
              ? "Wird übergeben..."
              : "Zur Wartung übergeben"}
          </Button>
        </div>

        {startMaintenanceMutation.isError && (
          <div className="alert alert-error mt-4">
            {startMaintenanceMutation.error instanceof Error
              ? startMaintenanceMutation.error.message
              : "Gerät konnte nicht zur Wartung übergeben werden."}
          </div>
        )}
      </motion.section>
    );
  }

  return null;
}
