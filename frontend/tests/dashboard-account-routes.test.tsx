import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
vi.mock("../src/components/templates/ProtectedDashboardLayout", () => ({ ProtectedDashboardLayout: ({ children }: { children: ReactNode }) => <section aria-label="ERP dashboard">{children}</section> }));
vi.mock("../src/features/auth-v2/pages/EmployeeAccountsPage", () => ({ EmployeeAccountsPage: () => <h1>Existing Auth-V2 account administration</h1> }));
vi.mock("../src/features/auth-v2/pages/AccountSecurityPage", () => ({ AccountSecurityPage: () => <h1>Existing account security</h1> }));
vi.mock("../src/features/auth-v2/pages/SessionsPage", () => ({ SessionsPage: () => <h1>Existing account sessions</h1> }));
vi.mock("../src/pages/EmployeesPage", () => ({ EmployeesPage: () => <h1>ERP employee business records</h1> }));
import { router } from "../src/router";
afterEach(cleanup);
describe("dashboard account route reuse", () => {
  it.each([
    ["/users", "Existing Auth-V2 account administration"],
    ["/account/security", "Existing account security"],
    ["/account/sessions", "Existing account sessions"],
    ["/employees", "ERP employee business records"],
  ])("directly resolves %s inside the existing dashboard", async (path, heading) => {
    const localRouter = createRouter({ routeTree: router.options.routeTree, history: createMemoryHistory({ initialEntries: [path] }) });
    render(<RouterProvider router={localRouter} />);
    expect(await screen.findByRole("heading", { name: heading })).toBeTruthy();
    expect(screen.getByRole("region", { name: "ERP dashboard" })).toBeTruthy();
  });
});
