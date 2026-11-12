import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthV2App } from "../../src/features/auth-v2/AuthV2App";
import {
  fieldLabel,
  installFetch,
  setPath,
  unauthenticated,
} from "./helpers";

const PASSWORD = "Correct-Horse-Battery-2026";

describe("Auth V2 Passwort- und Einladungsabläufe", () => {
  it("bestätigt die Passwortanfrage ohne Konten zu offenbaren", async () => {
    const fetchMock = installFetch([
      { path: "/api/auth-v2/account/me", reply: unauthenticated },
      {
        method: "POST",
        path: "/api/auth-v2/request-password-reset",
        reply: { body: { status: true } },
      },
    ]);

    setPath("/auth-v2/forgot-password");
    render(<AuthV2App />);

    await screen.findByRole("heading", { name: "Passwort vergessen?" });
    fireEvent.change(screen.getByLabelText(fieldLabel("E-Mail-Adresse")), {
      target: { value: "owner@nexus.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Link anfordern" }));

    await screen.findByRole("heading", { name: "Anfrage erhalten" });

    const call = fetchMock.mock.calls.find(([input]) =>
      String(input).endsWith("/request-password-reset"),
    );
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({
      email: "owner@nexus.test",
      redirectTo: `${window.location.origin}/auth-v2/reset-password`,
    });
  });

  it("validiert das neue Passwort und meldet Erfolg nach dem Zurücksetzen", async () => {
    installFetch([
      { path: "/api/auth-v2/account/me", reply: unauthenticated },
      {
        method: "POST",
        path: "/api/auth-v2/reset-password",
        reply: { body: { status: true } },
      },
    ]);

    setPath("/auth-v2/reset-password/abcdefghijklmnop");
    render(<AuthV2App />);

    await screen.findByRole("heading", { name: "Passwort zurücksetzen" });

    fireEvent.change(screen.getByLabelText(fieldLabel("Neues Passwort")), {
      target: { value: PASSWORD },
    });
    fireEvent.change(screen.getByLabelText(fieldLabel("Passwort bestätigen")), {
      target: { value: "Anderes-Passwort-2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Passwort speichern" }));

    expect(
      await screen.findByText("Die Passwörter stimmen nicht überein."),
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText(fieldLabel("Passwort bestätigen")), {
      target: { value: PASSWORD },
    });
    fireEvent.click(screen.getByRole("button", { name: "Passwort speichern" }));

    await waitFor(() =>
      expect(window.location.pathname).toBe("/auth-v2/signed-out"),
    );
    expect(window.location.search).toBe("?reason=password-reset");
  });

  it("verwirft einen ungültigen oder abgelaufenen Reset-Link", async () => {
    installFetch([
      { path: "/api/auth-v2/account/me", reply: unauthenticated },
      {
        method: "POST",
        path: "/api/auth-v2/reset-password",
        reply: { status: 400, body: { error: "INVALID_TOKEN" } },
      },
    ]);

    setPath("/auth-v2/reset-password/abcdefghijklmnop");
    render(<AuthV2App />);

    await screen.findByRole("heading", { name: "Passwort zurücksetzen" });
    fireEvent.change(screen.getByLabelText(fieldLabel("Neues Passwort")), {
      target: { value: PASSWORD },
    });
    fireEvent.change(screen.getByLabelText(fieldLabel("Passwort bestätigen")), {
      target: { value: PASSWORD },
    });
    fireEvent.click(screen.getByRole("button", { name: "Passwort speichern" }));

    await screen.findByRole("heading", {
      name: "Link ungültig oder abgelaufen",
    });
  });

  it("aktiviert ein Konto über eine gültige Einladung", async () => {
    const fetchMock = installFetch([
      { path: "/api/auth-v2/account/me", reply: unauthenticated },
      {
        method: "POST",
        path: "/api/auth-v2/invitations/accept",
        reply: {
          body: {
            status: true,
            user: {
              id: "22222222-2222-4222-8222-222222222222",
              email: "new@nexus.test",
              name: "Neue Person",
              role: "EMPLOYEE",
            },
          },
        },
      },
    ]);

    setPath("/auth-v2/accept-invitation?token=abcdefghijklmnopqrstuvwxyz");
    render(<AuthV2App />);

    await screen.findByRole("heading", { name: "Konto aktivieren" });

    fireEvent.change(screen.getByLabelText(fieldLabel("Vollständiger Name (optional)")), {
      target: { value: "Neue Person" },
    });
    fireEvent.change(screen.getByLabelText(fieldLabel("Passwort")), {
      target: { value: PASSWORD },
    });
    fireEvent.change(screen.getByLabelText(fieldLabel("Passwort bestätigen")), {
      target: { value: PASSWORD },
    });
    fireEvent.click(screen.getByRole("button", { name: "Konto aktivieren" }));

    await screen.findByRole("heading", { name: "Konto aktiviert" });

    const call = fetchMock.mock.calls.find(([input]) =>
      String(input).endsWith("/invitations/accept"),
    );
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({
      token: "abcdefghijklmnopqrstuvwxyz",
      name: "Neue Person",
      password: PASSWORD,
    });
  });

  it("zeigt eine zurückgezogene Einladung als endgültigen Fehler", async () => {
    installFetch([
      { path: "/api/auth-v2/account/me", reply: unauthenticated },
      {
        method: "POST",
        path: "/api/auth-v2/invitations/accept",
        reply: { status: 400, body: { error: "INVITATION_REVOKED" } },
      },
    ]);

    setPath("/auth-v2/accept-invitation?token=abcdefghijklmnopqrstuvwxyz");
    render(<AuthV2App />);

    await screen.findByRole("heading", { name: "Konto aktivieren" });
    fireEvent.change(screen.getByLabelText(fieldLabel("Passwort")), {
      target: { value: PASSWORD },
    });
    fireEvent.change(screen.getByLabelText(fieldLabel("Passwort bestätigen")), {
      target: { value: PASSWORD },
    });
    fireEvent.click(screen.getByRole("button", { name: "Konto aktivieren" }));

    await screen.findByRole("heading", { name: "Einladung nicht gültig" });
    expect(screen.getByText("Die Einladung wurde zurückgezogen.")).toBeTruthy();
  });
});
