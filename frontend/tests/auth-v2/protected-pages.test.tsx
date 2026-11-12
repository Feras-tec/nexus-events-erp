import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthV2App } from "../../src/features/auth-v2/AuthV2App";
import {
  accountMe,
  fieldLabel,
  installFetch,
  sessionRecord,
  setPath,
  unauthenticated,
} from "./helpers";

const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const EMPLOYEE_ID = "22222222-2222-4222-8222-222222222222";

function authRoute(
  user: Record<string, unknown> = {},
  session: Record<string, unknown> = {},
) {
  return {
    path: "/api/auth-v2/account/me",
    reply: { body: accountMe({ id: EMPLOYEE_ID, role: "EMPLOYEE", ...user }, session) },
  };
}

function dialogFor(title: string): HTMLElement {
  const heading = screen.getByRole("heading", { name: title });
  return heading.closest("dialog") as HTMLElement;
}

describe("Auth V2 geschützte Seiten", () => {
  it("leitet anonyme Nutzer zur Anmeldung und behält das Rückkehrziel", async () => {
    installFetch([
      { path: "/api/auth-v2/account/me", reply: unauthenticated },
    ]);

    setPath("/auth-v2/account/sessions");
    render(<AuthV2App />);

    await waitFor(() =>
      expect(window.location.pathname).toBe("/auth-v2/sign-in"),
    );
    expect(window.location.search).toContain(
      encodeURIComponent("/auth-v2/account/sessions"),
    );
  });

  it("listet Sitzungen, beendet eine fremde Sitzung und alle anderen", async () => {
    const sessions = [
      sessionRecord({ id: "session-current", ipAddress: "203.0.113.4" }),
      sessionRecord({
        id: "session-other",
        ipAddress: "198.51.100.7",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36",
      }),
    ];

    installFetch([
      authRoute(),
      {
        path: "/api/auth-v2/sessions",
        reply: { body: { currentSessionId: "session-current", sessions } },
      },
      {
        method: "POST",
        path: /\/api\/auth-v2\/sessions\/[^/]+\/revoke$/,
        reply: { body: { revoked: 1 } },
      },
      {
        method: "POST",
        path: "/api/auth-v2/sessions/revoke-others",
        reply: { body: { revoked: 1 } },
      },
    ]);

    setPath("/auth-v2/account/sessions");
    render(<AuthV2App />);

    await screen.findByRole("heading", { name: "Aktive Geräte" });
    expect(await screen.findByText("Dieses Gerät", { selector: ".badge" })).toBeTruthy();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Sitzung beenden" })[0]!,
    );

    fireEvent.click(
      within(dialogFor("Sitzung beenden")).getByRole("button", {
        name: "Sitzung beenden",
      }),
    );

    expect(await screen.findByText("Die Sitzung wurde beendet.")).toBeTruthy();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Alle anderen beenden" })[0]!,
    );
    fireEvent.click(
      within(dialogFor("Alle anderen Sitzungen beenden")).getByRole("button", {
        name: "Alle anderen beenden",
      }),
    );

    expect(
      await screen.findByText("1 weitere Sitzung(en) wurden beendet."),
    ).toBeTruthy();
  });

  it("zeigt MFA-Frist und validiert die Passwortänderung", async () => {
    installFetch([
      authRoute(),
      {
        path: "/api/auth-v2/mfa/policy",
        reply: {
          body: {
            required: true,
            enabled: false,
            enforcedAt: new Date().toISOString(),
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            enrollmentOverdue: false,
          },
        },
      },
    ]);

    setPath("/auth-v2/account/security");
    render(<AuthV2App />);

    await screen.findByRole("heading", { name: "Sicherheit und Anmeldung" });
    expect(await screen.findByText(/Einrichtung erforderlich bis/)).toBeTruthy();

    fireEvent.change(
      screen.getAllByLabelText(fieldLabel("Aktuelles Passwort"))[0]!,
      {
        target: { value: "current-password" },
      },
    );
    fireEvent.change(screen.getByLabelText(fieldLabel("Neues Passwort")), {
      target: { value: "kurz" },
    });
    fireEvent.change(screen.getByLabelText(fieldLabel("Neues Passwort bestätigen")), {
      target: { value: "kurz" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Passwort ändern" }));

    expect(
      await screen.findByText(
        "Das Passwort muss mindestens 12 Zeichen lang sein.",
      ),
    ).toBeTruthy();
  });

  it("verwaltet Mitarbeiterkonten inklusive Reauth-Hinweis", async () => {
    const users = [
      {
        id: OWNER_ID,
        email: "owner@nexus.test",
        name: "Test Owner",
        role: "OWNER",
        isActive: true,
        twoFactorRequired: false,
        createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
      },
      {
        id: EMPLOYEE_ID,
        email: "employee@nexus.test",
        name: "Employee One",
        role: "EMPLOYEE",
        isActive: true,
        twoFactorRequired: true,
        createdAt: new Date("2026-02-01T00:00:00Z").toISOString(),
      },
    ];

    let reauthNext = false;

    installFetch([
      authRoute({ id: OWNER_ID, role: "OWNER" }),
      { path: "/api/auth-v2/admin/users", reply: { body: { users } } },
      { method: "GET", path: "/api/auth-v2/invitations", reply: { body: { invitations: [] } } },
      {
        method: "PATCH",
        path: /\/api\/auth-v2\/admin\/users\/[^/]+$/,
        reply: () =>
          reauthNext
            ? { status: 403, body: { error: "REAUTH_REQUIRED" } }
            : {
                body: {
                  user: {
                    id: EMPLOYEE_ID,
                    email: "employee@nexus.test",
                    role: "ACCOUNTANT",
                    isActive: true,
                  },
                },
              },
      },
      {
        method: "POST",
        path: "/api/auth-v2/invitations",
        reply: {
          body: {
            invitation: {
              id: "inv-1",
              email: "new@nexus.test",
              role: "EMPLOYEE",
              expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
              acceptedAt: null,
              revokedAt: null,
              createdAt: new Date().toISOString(),
            },
            delivery: "email",
          },
        },
      },
    ]);

    setPath("/auth-v2/admin/employees");
    render(<AuthV2App />);

    await screen.findByRole("heading", { name: "Mitarbeiterkonten" });
    expect((await screen.findAllByText("employee@nexus.test")).length).toBeGreaterThan(0);

    // Edit the employee's role.
    fireEvent.click(screen.getAllByRole("button", { name: "Bearbeiten" })[0]!);
    let dialog = dialogFor("Konto bearbeiten");
    fireEvent.change(within(dialog).getByLabelText("Rolle"), {
      target: { value: "ACCOUNTANT" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Änderungen speichern" }),
    );

    expect(await screen.findByText("Das Konto wurde aktualisiert.")).toBeTruthy();

    // A stale step-up must close the dialog and surface a global banner.
    reauthNext = true;
    fireEvent.click(screen.getAllByRole("button", { name: "Bearbeiten" })[0]!);
    dialog = dialogFor("Konto bearbeiten");
    fireEvent.change(within(dialog).getByLabelText("Rolle"), {
      target: { value: "SALES_EMPLOYEE" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Änderungen speichern" }),
    );

    expect(
      await screen.findByText("Erneute Bestätigung erforderlich"),
    ).toBeTruthy();
    expect(
      screen.getByText(/Diese Aktion erfordert eine kürzlich erfolgte Anmeldung/),
    ).toBeTruthy();

    // Invitation creation never exposes a raw token.
    fireEvent.change(screen.getByLabelText(fieldLabel("E-Mail-Adresse")), {
      target: { value: "new@nexus.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Einladung senden" }));

    expect(
      await screen.findByText("Einladung an new@nexus.test versendet."),
    ).toBeTruthy();
    expect(screen.getByText(/Der Einladungslink kann in der Oberfläche/)).toBeTruthy();
  });

  it("zeigt Mitarbeitern keine Administrationsdaten", async () => {
    installFetch([authRoute({ role: "EMPLOYEE" })]);

    setPath("/auth-v2/admin/employees");
    render(<AuthV2App />);

    await screen.findByRole("heading", { name: "Mitarbeiterkonten" });
    expect(
      await screen.findByText(
        /Diese Ansicht ist Eigentümern und Administratoren vorbehalten/,
      ),
    ).toBeTruthy();
  });
});
