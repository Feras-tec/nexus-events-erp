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
