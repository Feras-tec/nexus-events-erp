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
        description="Zurückgekehrtes Gerät zur Prüfung übergeben."
        activeReservation={activeReservation}
        buttonLabel="Prüfung starten"
        buttonLoading={startInspectionMutation.isPending}
        onAction={() => startInspectionMutation.mutate()}
        error={startInspectionMutation.isError}
        errorMessage="Geräteprüfung konnte nicht gestartet werden."
      />
    );
  }

  if (equipment.status === "AT_EVENT") {
    return (
      <EquipmentMovementAction
        description="Rücktransport des Geräts vom Event starten."
        activeReservation={activeReservation}
        buttonLabel="Rücktransport starten"
        buttonLoading={startReturnMutation.isPending}
        onAction={() => startReturnMutation.mutate()}
        error={startReturnMutation.isError}
        errorMessage="Rücktransport konnte nicht gestartet werden."
      />
    );
  }

  if (equipment.status === "IN_TRANSIT") {
    return (
      <EquipmentMovementAction
        description="Ankunft des Geräts am Event bestätigen."
        activeReservation={activeReservation}
        buttonLabel="Am Event angekommen"
        buttonLoading={markDeliveredMutation.isPending}
        onAction={() => markDeliveredMutation.mutate()}
        error={markDeliveredMutation.isError}
        errorMessage="Ankunft am Event konnte nicht gespeichert werden."
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
