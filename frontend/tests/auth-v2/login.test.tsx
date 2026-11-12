import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthV2App } from "../../src/features/auth-v2/AuthV2App";
import {
  accountMe,
  fieldLabel,
  installFetch,
  setPath,
  unauthenticated,
} from "./helpers";

function renderSignIn() {
  setPath("/auth-v2/sign-in");
  return render(<AuthV2App />);
}

async function fillCredentials(email = "owner@nexus.test", password = "secret") {
  fireEvent.change(await screen.findByLabelText(fieldLabel("E-Mail-Adresse")), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText(fieldLabel("Passwort")), {
    target: { value: password },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /Anmelden/ }));
}

describe("Auth V2 Anmeldung", () => {
  it("validiert leere Felder clientseitig", async () => {
    installFetch([
      { path: "/api/auth-v2/account/me", reply: unauthenticated },
    ]);

    renderSignIn();
    await screen.findByRole("heading", { name: "Bei Nexus Events anmelden" });

    submit();

    const messages = await screen.findAllByText("Dieses Feld ist erforderlich.");
    expect(messages.length).toBe(2);
  });

  it("zeigt einen generischen Fehler bei falschen Anmeldedaten", async () => {
    installFetch([
      { path: "/api/auth-v2/account/me", reply: unauthenticated },
      {
        method: "POST",
        path: "/api/auth-v2/sign-in/email",
        reply: { status: 401, body: { error: "INVALID_CREDENTIALS" } },
      },
    ]);

    renderSignIn();
    await fillCredentials();
    submit();

    expect(
      await screen.findByText("E-Mail-Adresse oder Passwort ist falsch."),
    ).toBeTruthy();
    expect(window.location.pathname).toBe("/auth-v2/sign-in");
  });

  it("zeigt Rate-Limit und Countdown ohne interne Details", async () => {
    installFetch([
      { path: "/api/auth-v2/account/me", reply: unauthenticated },
      {
        method: "POST",
        path: "/api/auth-v2/sign-in/email",
        reply: {
          status: 429,
          body: { error: "RATE_LIMITED" },
          headers: { "Retry-After": "45" },
        },
      },
    ]);

    renderSignIn();
    await fillCredentials();
    submit();

    expect(
      await screen.findByText(/Zu viele Versuche\. Bitte in 45 Sekunden/),
    ).toBeTruthy();
  });

  it("leitet bei aktiver Zwei-Faktor-Anmeldung zur Codebestätigung", async () => {
    installFetch([
      { path: "/api/auth-v2/account/me", reply: unauthenticated },
      {
        method: "POST",
        path: "/api/auth-v2/sign-in/email",
        reply: { body: { twoFactorRedirect: true } },
      },
    ]);

    renderSignIn();
    await fillCredentials();
    submit();

    await waitFor(() =>
      expect(window.location.pathname).toBe("/auth-v2/two-factor"),
    );
  });

  it("leitet nach erfolgreicher Anmeldung in den geschützten Bereich", async () => {
    let authenticated = false;
    installFetch([
      {
        path: "/api/auth-v2/account/me",
        reply: () =>
          authenticated
            ? { body: accountMe({ role: "EMPLOYEE" }) }
            : unauthenticated,
      },
      {
        method: "POST",
        path: "/api/auth-v2/sign-in/email",
        reply: () => {
          authenticated = true;
          return { body: {} };
        },
      },
      { path: "/api/auth-v2/mfa/policy", reply: { body: { required: false, enabled: false, enforcedAt: null, deadline: null, enrollmentOverdue: false } } },
    ]);

    renderSignIn();
    await fillCredentials();
    submit();

    await waitFor(() =>
      expect(window.location.pathname).toBe("/auth-v2/account/security"),
    );
  });

  it("ignoriert fremde returnTo-Ziele (Open-Redirect-Schutz)", async () => {
    setPath("/auth-v2/sign-in?returnTo=https%3A%2F%2Fevil.test");
    installFetch([
      { path: "/api/auth-v2/account/me", reply: unauthenticated },
      {
        method: "POST",
        path: "/api/auth-v2/sign-in/email",
        reply: { body: { twoFactorRedirect: true } },
      },
    ]);

    render(<AuthV2App />);
    await fillCredentials();
    submit();

    await waitFor(() =>
      expect(window.location.pathname).toBe("/auth-v2/two-factor"),
    );
    expect(window.location.search).toContain(
      encodeURIComponent("/auth-v2/account/security"),
    );
  });
});
