import type { ReactNode } from "react";
import { motion } from "motion/react";

import { useTranslation } from "react-i18next";
import { Button } from "../../../components/atoms/Button";
import type { EquipmentMovement } from "../types/equipment.types";

type ActiveReservation = NonNullable<EquipmentMovement["reservation"]>;

type EquipmentMovementActionProps = {
  description: string;
  activeReservation: ActiveReservation | null;
  buttonLabel: string;
  buttonLoading?: boolean;
  buttonDisabled?: boolean;
  onAction: () => void;
  error?: boolean;
  errorMessage: string;
  children?: ReactNode;
};

export function EquipmentMovementAction({
  description,
  activeReservation,
  buttonLabel,
  buttonLoading = false,
  buttonDisabled = false,
  onAction,
  error = false,
  errorMessage,
  children,
}: EquipmentMovementActionProps) {
  const { t } = useTranslation();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
    >
      <h2 className="text-lg font-semibold">
        {t("equipment.actions.newMovement")}
      </h2>

      <p className="mt-1 text-sm text-base-content/60">
        {description}
      </p>

      {activeReservation ? (
        <div className="mt-5 rounded-box border border-base-300 p-4">
          <div className="font-semibold">
            {activeReservation.event.eventNo} ·{" "}
            {activeReservation.event.name}
          </div>

          {children}

          <Button
            type="button"
            className="mt-4"
            loading={buttonLoading}
            disabled={buttonDisabled || buttonLoading}
            onClick={onAction}
          >
            {buttonLabel}
          </Button>
        </div>
      ) : (
        <div className="alert alert-warning mt-5">
          {t("equipment.actions.noReservation")}
        </div>
      )}

      {error && (
        <div className="alert alert-error mt-4">
          {errorMessage}
        </div>
      )}
    </motion.section>
  );
}
