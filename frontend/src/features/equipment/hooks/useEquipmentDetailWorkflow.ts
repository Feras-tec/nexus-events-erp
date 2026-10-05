import type { EquipmentMovement } from "../types/equipment.types";

const eventWorkflowStatuses = [
  "RESERVED",
  "PICKING",
  "PACKED",
  "IN_TRANSIT",
  "AT_EVENT",
  "RETURNING",
  "INSPECTION",
] as const;

type EquipmentStatus = (typeof eventWorkflowStatuses)[number];

type EquipmentWithStatus = {
  status: string;
};

export function useEquipmentDetailWorkflow(
  equipment: EquipmentWithStatus | null | undefined,
  movements: EquipmentMovement[],
) {
  const isEventWorkflowActive =
    equipment !== null &&
    equipment !== undefined &&
    eventWorkflowStatuses.includes(
      equipment.status as EquipmentStatus,
    );

  const activeMovementReservation = isEventWorkflowActive
    ? movements.find((movement) => movement.reservation)?.reservation ??
      null
    : null;

  const checkedOutMovement = activeMovementReservation
    ? movements.find(
        (movement) =>
          movement.type === "LOADED" &&
          movement.reservation?.id ===
            activeMovementReservation.id,
      )
    : undefined;

  return {
    isEventWorkflowActive,
    activeMovementReservation,
    checkedOutMovement,
  };
}
