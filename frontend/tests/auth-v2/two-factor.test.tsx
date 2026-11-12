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

function renderTwoFactor() {
  setPath("/auth-v2/two-factor");
  return render(<AuthV2App />);
}

describe("Auth V2 Zwei-Faktor-Anmeldung", () => {
  it("meldet einen ungültigen TOTP-Code und wechselt auf Wiederherstellungscodes", async () => {
    let authenticated = false;
    const fetchMock = installFetch([
      {
        path: "/api/auth-v2/account/me",
        reply: () =>
          authenticated
            ? { body: accountMe({ role: "EMPLOYEE" }) }
            : unauthenticated,
      },
      {
        method: "POST",
        path: "/api/auth-v2/two-factor/verify-totp",
        reply: { status: 401, body: { error: "INVALID_CODE" } },
      },
      {
        method: "POST",
        path: "/api/auth-v2/two-factor/verify-backup-code",
        reply: () => {
          authenticated = true;
          return { body: { status: true } };
        },
      },
      {
        path: "/api/auth-v2/mfa/policy",
        reply: {
          body: {
            required: false,
            enabled: true,
            enforcedAt: null,
            deadline: null,
            enrollmentOverdue: false,
          },
        },
      },
    ]);

    renderTwoFactor();
    await screen.findByRole("heading", { name: "Bestätigung erforderlich" });

    fireEvent.change(screen.getByLabelText("Ziffer 1 von 6"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Bestätigen" }));

    expect(
      await screen.findByText("Der Code ist ungültig oder abgelaufen."),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Wiederherstellungscode/ }));
    fireEvent.change(screen.getByLabelText(fieldLabel("Wiederherstellungscode")), {
      target: { value: "  ab12C-dE34f  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Bestätigen" }));

    await waitFor(() =>
      expect(window.location.pathname).toBe("/auth-v2/account/security"),
    );

    const backupCall = fetchMock.mock.calls.find(([input]) =>
      String(input).endsWith("/two-factor/verify-backup-code"),
    );
    expect(backupCall?.[1]?.body).toBe(
      JSON.stringify({ code: "ab12C-dE34f" }),
    );
  });

  it("blockiert die Bestätigung, bis sechs Ziffern eingegeben sind", async () => {
    installFetch([
      { path: "/api/auth-v2/account/me", reply: unauthenticated },
    ]);

    renderTwoFactor();
    await screen.findByRole("heading", { name: "Bestätigung erforderlich" });

    const submit = screen.getByRole("button", { name: "Bestätigen" });
    expect(submit).toHaveProperty("disabled", true);

    fireEvent.change(screen.getByLabelText("Ziffer 1 von 6"), {
      target: { value: "12345" },
    });
    expect(submit).toHaveProperty("disabled", true);

    fireEvent.change(screen.getByLabelText("Ziffer 6 von 6"), {
      target: { value: "6" },
    });
    expect(submit).toHaveProperty("disabled", false);
  });
});
