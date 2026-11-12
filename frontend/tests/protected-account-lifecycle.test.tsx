import type { ReactNode } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthQueryProvider } from "../src/components/providers/AuthQueryProvider";
import { ProtectedDashboardLayout } from "../src/components/templates/ProtectedDashboardLayout";
import { useAppUser } from "../src/features/users/context/AppUserContext";
import "../src/i18n/config";

// Geschützte Kontoprüfung und Cache-Grenze gemeinsam ohne externe Anmeldedienste testen.
const mocks = vi.hoisted(() => ({
  auth: { isLoaded: true, isSignedIn: true, userId: "A" as string | null, sessionId: "session-A" as string | null, getToken: vi.fn(async () => "token") },
  apiFetch: vi.fn(),
  pathname: "/dashboard",
}));
vi.mock("@clerk/react", () => ({ useAuth: () => mocks.auth }));
vi.mock("../src/features/auth/AppAuthProvider", () => ({
  useAppAuth: () => ({
    mode: "clerk",
    isLoaded: mocks.auth.isLoaded,
    isAuthenticated: Boolean(mocks.auth.isSignedIn && mocks.auth.userId),
    userId: mocks.auth.userId,
    getToken: mocks.auth.getToken,
    logout: vi.fn(async () => {}),
    user: null,
    authV2Status: null,
    authV2Reason: null,
  }),
}));
vi.mock("../src/services/api", () => ({ apiFetch: mocks.apiFetch }));
vi.mock("../src/components/templates/DashboardLayout", () => ({ DashboardLayout: ({ children }: { children: ReactNode }) => children }));
vi.mock("@tanstack/react-router", () => ({
  Navigate: () => <div>signed-out</div>,
  useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: mocks.pathname } }),
}));

function Account() {
  const account = useAppUser();
  return <div data-testid="account">{account?.clerkUserId}:{account?.role}</div>;
}
function tree() {
  return <AuthQueryProvider><ProtectedDashboardLayout><Account /></ProtectedDashboardLayout></AuthQueryProvider>;
}
function response(
  id: string,
  role = "EMPLOYEE",
  isActive = true,
) {
  return { json: async () => ({ user: { id, clerkUserId: id, role, isActive } }) };
}
beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(mocks.auth, { isLoaded: true, isSignedIn: true, userId: "A", sessionId: "session-A" });
  mocks.auth.getToken.mockResolvedValue("token");
  mocks.pathname = "/dashboard";
});
afterEach(cleanup);

describe("Geschützte Routen beim Kontowechsel", () => {
  it("initialisiert das Konto nach Logout und erneutem Login neu", async () => {
    mocks.apiFetch.mockResolvedValue(response("A"));
    const view = render(tree());
    await waitFor(() => expect(screen.getByTestId("account").textContent).toBe("A:EMPLOYEE"));
    Object.assign(mocks.auth, { isSignedIn: false, userId: null, sessionId: null });
    view.rerender(tree());
    expect(screen.queryByTestId("account")).toBeNull();
    expect(screen.getByText("signed-out")).toBeTruthy();
    Object.assign(mocks.auth, { isSignedIn: true, userId: "A", sessionId: "session-A-new" });
    view.rerender(tree());
    expect(screen.queryByTestId("account")).toBeNull();
    await waitFor(() => expect(screen.getByTestId("account").textContent).toBe("A:EMPLOYEE"));
    expect(mocks.apiFetch).toHaveBeenCalledTimes(2);
  });

  it("übernimmt alte Kontofehler nicht in die nächste Anmeldung", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.apiFetch.mockRejectedValueOnce(new Error("A unavailable"));
      const view = render(tree());
      await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
      Object.assign(mocks.auth, { userId: "B", sessionId: "session-B" });
      mocks.apiFetch.mockResolvedValue(response("B"));
      view.rerender(tree());
      expect(screen.queryByRole("alert")).toBeNull();
      await waitFor(() => expect(screen.getByTestId("account").textContent).toBe("B:EMPLOYEE"));
    } finally { log.mockRestore(); }
  });

  it("ignoriert eine verspätete /auth/me-Antwort des vorherigen Kontos", async () => {
    let resolve!: (value: ReturnType<typeof response>) => void;
    const pending = new Promise<ReturnType<typeof response>>(done => { resolve = done; });
    mocks.apiFetch.mockReturnValueOnce(pending);
    const view = render(tree());
    await waitFor(() => expect(mocks.apiFetch).toHaveBeenCalledTimes(1));
    Object.assign(mocks.auth, { userId: "B", sessionId: "session-B" });
    mocks.apiFetch.mockResolvedValue(response("B"));
    view.rerender(tree());
    await waitFor(() => expect(screen.getByTestId("account").textContent).toBe("B:EMPLOYEE"));
    await act(async () => { resolve(response("A")); await pending; });
    expect(screen.getByTestId("account").textContent).toBe("B:EMPLOYEE");
  });

  it("zeigt nicht freigegebenen Benutzern keinen geschützten Inhalt", async () => {
    mocks.apiFetch.mockResolvedValue(response("A", "EMPLOYEE", false));
    render(tree());
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "noch nicht freigegeben",
      ),
    );
    expect(screen.queryByTestId("account")).toBeNull();
  });

  it("verweigert den Zugriff auf Bereiche ohne Leserecht", async () => {
    mocks.pathname = "/users";
    mocks.apiFetch.mockResolvedValue(response("A", "EMPLOYEE"));
    render(tree());
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Keine Berechtigung",
      ),
    );
    expect(screen.queryByTestId("account")).toBeNull();
  });

  it("erlaubt OWNER den Zugriff auf die Benutzerverwaltung", async () => {
    mocks.pathname = "/users";
    mocks.apiFetch.mockResolvedValue(response("A", "OWNER"));
    render(tree());
    await waitFor(() =>
      expect(screen.getByTestId("account").textContent).toBe("A:OWNER"),
    );
  });
});
