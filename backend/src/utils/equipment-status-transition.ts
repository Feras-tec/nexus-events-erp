type EquipmentStatus =
  | "RECEIVED"
  | "AVAILABLE"
  | "RESERVED"
  | "PICKING"
  | "PACKED"
  | "IN_TRANSIT"
  | "AT_EVENT"
  | "RETURNING"
  | "INSPECTION"
  | "DAMAGED"
  | "MAINTENANCE"
  | "REPAIRED"
  | "LOST"
  | "RETIRED";

// Erlaubte Statusübergänge für Geräte
const allowedTransitions: Record<EquipmentStatus, EquipmentStatus[]> = {
  RECEIVED: ["AVAILABLE"],
  AVAILABLE: ["RESERVED", "MAINTENANCE", "LOST", "RETIRED"],
  RESERVED: ["AVAILABLE", "PICKING"],
  PICKING: ["PACKED", "AVAILABLE"],
  PACKED: ["IN_TRANSIT", "AVAILABLE"],
  IN_TRANSIT: ["AT_EVENT", "RETURNING", "LOST"],
  AT_EVENT: ["RETURNING", "LOST"],
  RETURNING: ["INSPECTION", "LOST"],
  INSPECTION: ["AVAILABLE", "DAMAGED", "MAINTENANCE"],
  DAMAGED: ["MAINTENANCE", "RETIRED"],
  MAINTENANCE: ["REPAIRED", "RETIRED"],
  REPAIRED: ["AVAILABLE"],
  LOST: ["AVAILABLE", "RETIRED"],
  RETIRED: [],
};

export function isEquipmentStatusTransitionAllowed(
  fromStatus: EquipmentStatus,
  toStatus: EquipmentStatus,
): boolean {
  return allowedTransitions[fromStatus].includes(toStatus);
}

type EquipmentMovementType =
  | "RECEIVED"
  | "RESERVED"
  | "RELEASED"
  | "PICKED"
  | "PACKED"
  | "LOADED"
  | "TRANSFERRED"
  | "DELIVERED_TO_EVENT"
  | "RETURNED_FROM_EVENT"
  | "INSPECTION"
  | "MAINTENANCE"
  | "REPAIRED"
  | "LOST"
  | "RECOVERED"
  | "RETIRED"
  | "MANUAL_ADJUSTMENT";

// Prüft, ob der Bewegungstyp zum konkreten Statusübergang passt
export function isEquipmentMovementTypeValid(
  fromStatus: EquipmentStatus,
  movementType: EquipmentMovementType,
  toStatus: EquipmentStatus,
): boolean {
  // Sonderfälle werden im Controller zusätzlich geprüft
  if (movementType === "MANUAL_ADJUSTMENT") {
    return true;
  }

  if (movementType === "TRANSFERRED") {
    return fromStatus === toStatus;
  }

  const validMovements: Partial<
    Record<
      EquipmentStatus,
      Partial<Record<EquipmentStatus, EquipmentMovementType[]>>
    >
  > = {
    RECEIVED: {
      AVAILABLE: ["RECEIVED"],
    },

    AVAILABLE: {
      RESERVED: ["RESERVED"],
      MAINTENANCE: ["MAINTENANCE"],
      LOST: ["LOST"],
      RETIRED: ["RETIRED"],
    },

    RESERVED: {
      AVAILABLE: ["RELEASED"],
      PICKING: ["PICKED"],
    },

    PICKING: {
      PACKED: ["PACKED"],
      AVAILABLE: ["RELEASED"],
    },

    PACKED: {
      IN_TRANSIT: ["LOADED"],
      AVAILABLE: ["RELEASED"],
    },

    IN_TRANSIT: {
      AT_EVENT: ["DELIVERED_TO_EVENT"],
      RETURNING: ["RETURNED_FROM_EVENT"],
      LOST: ["LOST"],
    },

    AT_EVENT: {
      RETURNING: ["RETURNED_FROM_EVENT"],
      LOST: ["LOST"],
    },

    RETURNING: {
      INSPECTION: ["INSPECTION"],
      LOST: ["LOST"],
    },

    INSPECTION: {
      AVAILABLE: ["INSPECTION"],
      DAMAGED: ["INSPECTION"],
      MAINTENANCE: ["MAINTENANCE"],
    },

    DAMAGED: {
      MAINTENANCE: ["MAINTENANCE"],
      RETIRED: ["RETIRED"],
    },

    MAINTENANCE: {
      REPAIRED: ["REPAIRED"],
      RETIRED: ["RETIRED"],
    },

    REPAIRED: {
      AVAILABLE: ["REPAIRED"],
    },

    LOST: {
      AVAILABLE: ["RECOVERED"],
      RETIRED: ["RETIRED"],
    },
  };

  return validMovements[fromStatus]?.[toStatus]?.includes(movementType) ?? false;
}
