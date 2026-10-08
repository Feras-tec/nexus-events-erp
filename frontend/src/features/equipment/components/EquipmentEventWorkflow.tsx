import type {
  EquipmentDetail,
  EquipmentMovement,
} from "../types/equipment.types";
import { useEquipmentEventWorkflow } from "../hooks/useEquipmentEventWorkflow";
import { useEquipmentLegacyRecovery } from "../hooks/useEquipmentLegacyRecovery";
import { useEquipmentEmployees } from "../hooks/useEquipmentEmployees";
import { EquipmentMovementAction } from "./EquipmentMovementAction";
import { EquipmentPackedAction } from "./EquipmentPackedAction";
import { useState } from "react";
import { useTranslation } from "react-i18next";


type ActiveReservation = NonNullable<EquipmentMovement["reservation"]>;

type EquipmentEventWorkflowProps = {
  equipmentId: string;
  equipment: EquipmentDetail;
  activeReservation: ActiveReservation | null;
};

export function EquipmentEventWorkflow({
  equipmentId,
  equipment,
  activeReservation,
}: EquipmentEventWorkflowProps) {
  const { t } = useTranslation();
  const [responsibleEmployeeId, setResponsibleEmployeeId] = useState("");

  const {
    data: employees = [],
    isLoading: employeesLoading,
    isError: employeesError,
  } = useEquipmentEmployees();
  const {
    markLoadedMutation,
    markDeliveredMutation,
    startReturnMutation,
    startInspectionMutation,
  } = useEquipmentEventWorkflow({
    equipmentId,
    equipment,
    activeReservation,
    responsibleEmployeeId,
  });

  useEquipmentLegacyRecovery({
    equipmentId,
    equipment,
    activeReservation,
  });


  if (equipment.status === "RETURNING") {
    return (
      <EquipmentMovementAction
        description={t("equipment.eventWorkflow.inspectionDescription")}
        activeReservation={activeReservation}
        buttonLabel={t("equipment.eventWorkflow.startInspection")}
        buttonLoading={startInspectionMutation.isPending}
        onAction={() => startInspectionMutation.mutate()}
        error={startInspectionMutation.isError}
        errorMessage={t("equipment.eventWorkflow.inspectionError")}
      />
    );
  }

  if (equipment.status === "AT_EVENT") {
    return (
      <EquipmentMovementAction
        description={t("equipment.eventWorkflow.returnDescription")}
        activeReservation={activeReservation}
        buttonLabel={t("equipment.eventWorkflow.startReturn")}
        buttonLoading={startReturnMutation.isPending}
        onAction={() => startReturnMutation.mutate()}
        error={startReturnMutation.isError}
        errorMessage={t("equipment.eventWorkflow.returnError")}
      />
    );
  }

  if (equipment.status === "IN_TRANSIT") {
    return (
      <EquipmentMovementAction
        description={t("equipment.eventWorkflow.deliveryDescription")}
        activeReservation={activeReservation}
        buttonLabel={t("equipment.eventWorkflow.confirmArrival")}
        buttonLoading={markDeliveredMutation.isPending}
        onAction={() => markDeliveredMutation.mutate()}
        error={markDeliveredMutation.isError}
        errorMessage={t("equipment.eventWorkflow.deliveryError")}
      />
    );
  }

  if (equipment.status === "PACKED") {
    return (
      <EquipmentPackedAction
        activeReservation={activeReservation}
        employees={employees}
        employeesLoading={employeesLoading}
        employeesError={employeesError}
        responsibleEmployeeId={responsibleEmployeeId}
        markLoadedPending={markLoadedMutation.isPending}
        markLoadedError={markLoadedMutation.isError}
        onEmployeeChange={setResponsibleEmployeeId}
        onMarkLoaded={() => markLoadedMutation.mutate()}
      />
    );
  }

  return null;
}
