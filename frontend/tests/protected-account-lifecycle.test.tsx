import type { ReactNode } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthQueryProvider } from "../src/components/providers/AuthQueryProvider";
import { ProtectedDashboardLayout } from "../src/components/templates/ProtectedDashboardLayout";
import { useAppUser } from "../src/features/users/context/AppUserContext";

// Geschützte Kontoprüfung und Cache-Grenze gemeinsam ohne externe Anmeldedienste testen.
const mocks = vi.hoisted(() => ({
  auth: { isLoaded: true, isSignedIn: true, userId: "A" as string | null, sessionId: "session-A" as string | null, getToken: vi.fn(async () => "token") },
  apiFetch: vi.fn(),
}));
vi.mock("@clerk/react", () => ({ useAuth: () => mocks.auth }));
vi.mock("../src/services/api", () => ({ apiFetch: mocks.apiFetch }));
vi.mock("../src/components/templates/DashboardLayout", () => ({ DashboardLayout: ({ children }: { children: ReactNode }) => children }));
vi.mock("@tanstack/react-router", () => ({ Navigate: () => <div>signed-out</div> }));

function Account() {
  const account = useAppUser();
  return <div data-testid="account">{account?.clerkUserId}:{account?.role}</div>;
}
function tree() {
  return <AuthQueryProvider><ProtectedDashboardLayout><Account /></ProtectedDashboardLayout></AuthQueryProvider>;
}
function response(id: string) {
  return { json: async () => ({ user: { id, clerkUserId: id, role: "EMPLOYEE", isActive: true } }) };
}
beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(mocks.auth, { isLoaded: true, isSignedIn: true, userId: "A", sessionId: "session-A" });
  mocks.auth.getToken.mockResolvedValue("token");
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
});
