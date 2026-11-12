import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../src/i18n/config";
import { DashboardLayout } from "../src/components/templates/DashboardLayout";
import { canAccessPath } from "../src/features/auth/permissions";
const state = vi.hoisted(() => ({ role: "OWNER", pathname: "/dashboard", logout: vi.fn(async () => {}) }));
vi.mock("../src/features/users/context/AppUserContext", () => ({ useAppUser: () => ({ role: state.role, isActive: true }) }));
vi.mock("../src/features/auth/AppAuthProvider", () => ({ useAppAuth: () => ({ logout: state.logout }) }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => <a href={to} {...props}>{children}</a>,
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => unknown }) => select({ location: { pathname: state.pathname } }),
}));
beforeEach(async () => { state.role = "OWNER"; state.pathname = "/dashboard"; state.logout.mockClear(); await i18n.changeLanguage("de"); });
afterEach(cleanup);
describe("dashboard Auth-V2 account navigation", () => {
  it.each(["OWNER", "ADMIN"])("shows account administration separately from ERP employees for %s", role => {
    state.role = role; render(<DashboardLayout><p>ERP content</p></DashboardLayout>);
    expect(screen.getByRole("link", { name: "Benutzerverwaltung" }).getAttribute("href")).toBe("/users");
    expect(screen.getByRole("link", { name: "Mitarbeiter" }).getAttribute("href")).toBe("/employees");
    expect(canAccessPath(role, "/users")).toBe(true);
  });
  it.each(["EMPLOYEE", "ACCOUNTANT", "TECHNICIAN"])("hides and denies administration for %s", role => {
    state.role = role; render(<DashboardLayout><p>ERP content</p></DashboardLayout>);
    expect(screen.queryByRole("link", { name: "Benutzerverwaltung" })).toBeNull();
    expect(canAccessPath(role, "/users")).toBe(false);
    expect(screen.getByRole("link", { name: "Sicherheit" }).getAttribute("href")).toBe("/account/security");
    expect(screen.getByRole("link", { name: "Sitzungen" }).getAttribute("href")).toBe("/account/sessions");
  });
  it("uses localized account links and logout without exposing any credential", async () => {
    render(<DashboardLayout><p>ERP content</p></DashboardLayout>);
    fireEvent.click(screen.getByRole("button", { name: "Abmelden" })); expect(state.logout).toHaveBeenCalledOnce();
  });
  it("mobile navigation includes administration and closes when a link is selected", () => {
    render(<DashboardLayout><p>ERP content</p></DashboardLayout>);
    const toggle = screen.getByRole("button", { name: i18n.t("navigation.open") });
    fireEvent.click(toggle); expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("link", { name: "Benutzerverwaltung" }));
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });
  it("preserves Arabic account labels and RTL-ready mobile navigation", async () => {
    await i18n.changeLanguage("ar"); render(<DashboardLayout><p>ERP content</p></DashboardLayout>);
    expect(screen.getByRole("link", { name: i18n.t("authV2.nav.sessions") }).getAttribute("href")).toBe("/account/sessions");
    expect(screen.getByRole("link", { name: i18n.t("authV2.nav.security") }).getAttribute("href")).toBe("/account/security");
    fireEvent.click(screen.getByRole("button", { name: i18n.t("navigation.open") }));
    expect(within(screen.getByRole("dialog")).getByRole("link", { name: i18n.t("navigation.users") }).getAttribute("href")).toBe("/users");
  });
});

describe("user administration tab bar", () => {
  const tabNavigation = () =>
    screen.getByRole("navigation", { name: i18n.t("authV2.nav.label") });
  const sidebarNavigation = () =>
    screen.getByRole("navigation", { name: i18n.t("app.erpManagement") });

  it.each([
    ["/account/security", "Sicherheit"],
    ["/account/sessions", "Sitzungen"],
    ["/users", "Mitarbeiter"],
  ])(
    "renders the three tabs on %s and highlights the active one",
    (pathname, activeLabel) => {
      state.pathname = pathname;
      render(<DashboardLayout><p>ERP content</p></DashboardLayout>);

      const tabs = within(tabNavigation()).getAllByRole("link");
      expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
        i18n.t("authV2.nav.security"),
        i18n.t("authV2.nav.sessions"),
        i18n.t("authV2.nav.employees"),
      ]);

      const active = within(tabNavigation()).getByRole("link", {
        name: activeLabel,
      });
      expect(active.getAttribute("aria-current")).toBe("page");
      expect(
        tabs.filter((tab) => tab.getAttribute("aria-current") === "page"),
      ).toHaveLength(1);
    },
  );

  it.each([
    ["/account/security"],
    ["/account/sessions"],
    ["/users"],
  ])(
    "keeps the Benutzerverwaltung sidebar item selected on %s",
    (pathname) => {
      state.pathname = pathname;
      render(<DashboardLayout><p>ERP content</p></DashboardLayout>);

      const usersLink = within(sidebarNavigation()).getByRole("link", {
        name: i18n.t("navigation.users"),
      });
      expect(usersLink.getAttribute("aria-current")).toBe("page");
    },
  );

  it("keeps the tab strip horizontally scrollable without overflowing the page", () => {
    state.pathname = "/account/security";
    render(<DashboardLayout><p>ERP content</p></DashboardLayout>);

    expect(tabNavigation().className).toContain("overflow-x-auto");
    expect(tabNavigation().querySelector("ul")?.className).toContain(
      "min-w-max",
    );
  });

  it.each(["EMPLOYEE", "ACCOUNTANT", "TECHNICIAN"])(
    "hides the employee-account tab from %s while keeping personal tabs",
    (role) => {
      state.role = role;
      state.pathname = "/account/sessions";
      render(<DashboardLayout><p>ERP content</p></DashboardLayout>);

      expect(
        within(tabNavigation()).queryByRole("link", {
          name: i18n.t("authV2.nav.employees"),
        }),
      ).toBeNull();
      expect(
        within(tabNavigation())
          .getByRole("link", { name: i18n.t("authV2.nav.security") })
          .getAttribute("href"),
      ).toBe("/account/security");
      expect(
        within(tabNavigation())
          .getByRole("link", { name: i18n.t("authV2.nav.sessions") })
          .getAttribute("aria-current"),
      ).toBe("page");
    },
  );

  it("localizes the tabs for Arabic RTL users", async () => {
    await i18n.changeLanguage("ar");
    state.pathname = "/account/security";
    render(<DashboardLayout><p>ERP content</p></DashboardLayout>);

    expect(
      within(tabNavigation()).getByRole("link", {
        name: i18n.t("authV2.nav.security"),
      }).getAttribute("href"),
    ).toBe("/account/security");
    expect(
      within(tabNavigation()).getByRole("link", {
        name: i18n.t("authV2.nav.employees"),
      }).getAttribute("href"),
    ).toBe("/users");
  });
});
