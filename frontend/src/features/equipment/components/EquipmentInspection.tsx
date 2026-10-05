import { motion } from "motion/react";

import { Button } from "../../../components/atoms/Button";

type InspectionResult = "AVAILABLE" | "DAMAGED" | "MAINTENANCE";

type EquipmentInspectionProps = {
  isPending: boolean;
  isError: boolean;
  onComplete: (result: InspectionResult) => void;
};

export function EquipmentInspection({
  isPending,
  isError,
  onComplete,
}: EquipmentInspectionProps) {
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
          onClick={() => onComplete("AVAILABLE")}
        >
          Einsatzbereit
        </Button>

        <Button
          type="button"
          disabled={isPending}
          onClick={() => onComplete("DAMAGED")}
        >
          Beschädigt
        </Button>

        <Button
          type="button"
          disabled={isPending}
          onClick={() => onComplete("MAINTENANCE")}
        >
          Wartung erforderlich
        </Button>
      </div>

      {isError && (
        <div className="alert alert-error mt-4">
          Prüfergebnis konnte nicht gespeichert werden.
        </div>
      )}
    </motion.section>
  );
}
