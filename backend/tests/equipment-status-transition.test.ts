import { describe, expect, test } from "@jest/globals";
import { isEquipmentStatusTransitionAllowed } from "../src/utils/equipment-status-transition.js";

describe("Equipment status transitions", () => {
  test("allows a valid return workflow", () => {
    expect(
      isEquipmentStatusTransitionAllowed("AT_EVENT", "RETURNING"),
    ).toBe(true);

    expect(
      isEquipmentStatusTransitionAllowed("RETURNING", "INSPECTION"),
    ).toBe(true);

    expect(
      isEquipmentStatusTransitionAllowed("INSPECTION", "AVAILABLE"),
    ).toBe(true);
  });

  test("rejects an invalid status transition", () => {
    expect(
      isEquipmentStatusTransitionAllowed("AVAILABLE", "AT_EVENT"),
    ).toBe(false);
  });
});
