import { describe, expect, it } from "vitest";

import {
  can,
  canAccessPath,
  filterNavigation,
  getAreaForPath,
} from "../src/features/auth/permissions";

describe("Rollenabhängige Berechtigungen", () => {
  it("spiegelt die Leserechte der Backend-Routen wider", () => {
    expect(can("OWNER", "users")).toBe(true);
    expect(can("ADMIN", "users")).toBe(true);
    expect(can("EMPLOYEE", "users")).toBe(false);

    expect(can("ACCOUNTANT", "invoices")).toBe(true);
    expect(can("ACCOUNTANT", "invoices", "create")).toBe(true);
    expect(can("ACCOUNTANT", "quotes")).toBe(true);
    expect(can("ACCOUNTANT", "quotes", "update")).toBe(false);

    expect(can("SALES_MANAGER", "invoices")).toBe(true);
    expect(
      can("SALES_MANAGER", "invoices", "create"),
    ).toBe(false);
  });

  it("ordnet Pfade den richtigen Bereichen zu", () => {
    expect(getAreaForPath("/equipment/abc")).toBe("inventory");
    expect(getAreaForPath("/invoices/abc")).toBe("invoices");
    expect(getAreaForPath("/unknown")).toBeNull();

    expect(canAccessPath("TECHNICIAN", "/products/abc")).toBe(
      true,
    );
    expect(canAccessPath("TECHNICIAN", "/customers")).toBe(false);
    expect(canAccessPath("ACCOUNTANT", "/invoices")).toBe(true);
    expect(canAccessPath("ACCOUNTANT", "/events")).toBe(false);
  });

  it("filtert die Navigation nach Leserechten", () => {
    const items = [
      { key: "dashboard" },
      { key: "users" },
      { key: "events" },
      { key: "invoices" },
    ];

    expect(
      filterNavigation(items, "ACCOUNTANT").map(
        (item) => item.key,
      ),
    ).toEqual(["dashboard", "invoices"]);

    expect(
      filterNavigation(items, "OWNER").map(
        (item) => item.key,
      ),
    ).toEqual([
      "dashboard",
      "users",
      "events",
      "invoices",
    ]);
  });

  it("behandelt fehlende Rollen restriktiv", () => {
    expect(can(undefined, "dashboard")).toBe(false);
    expect(canAccessPath(undefined, "/dashboard")).toBe(false);
    expect(filterNavigation([{ key: "events" }], undefined)).toEqual(
      [],
    );
  });
});
