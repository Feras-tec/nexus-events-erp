import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("qrcode", () => ({
  default: { toCanvas: vi.fn(async () => undefined) },
}));

import { AuthV2App } from "../../src/features/auth-v2/AuthV2App";
import { accountMe, fieldLabel, installFetch, setPath } from "./helpers";

const TOTP_URI =
  "otpauth://totp/Nexus:owner@nexus.test?secret=JBSWY3DPEHPK3PXP&issuer=Nexus";

describe("Auth V2 MFA-Einrichtung", () => {
  it("zeigt QR-Schlüssel und Wiederherstellungscodes genau einmal an", async () => {
    let enabled = false;
    const fetchMock = installFetch([
      {
        path: "/api/auth-v2/account/me",
        reply: () =>
          ({
            body: accountMe({
              role: "EMPLOYEE",
              twoFactorEnabled: enabled,
            }),
          }),
      },
      {
        method: "POST",
        path: "/api/auth-v2/two-factor/enable",
        reply: {
          body: {
            method: "totp",
            totpURI: TOTP_URI,
            backupCodes: ["abcde-12345", "fghij-67890"],
          },
        },
      },
      {
        method: "POST",
        path: "/api/auth-v2/two-factor/verify-totp",
        reply: () => {
          enabled = true;
          return { body: { status: true } };
        },
      },
      {
        path: "/api/auth-v2/mfa/policy",
        reply: {
          body: {
            required: true,
            enabled: true,
            enforcedAt: new Date().toISOString(),
            deadline: null,
            enrollmentOverdue: false,
          },
        },
      },
    ]);

    setPath("/auth-v2/mfa/enroll");
    render(<AuthV2App />);

    await screen.findByRole("heading", {
      name: "Mehrfachauthentifizierung einrichten",
    });

    fireEvent.change(screen.getByLabelText(fieldLabel("Aktuelles Passwort")), {
      target: { value: "Correct-Horse-Battery-2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Einrichtung starten" }));

    expect(await screen.findByText("abcde-12345")).toBeTruthy();
    expect(screen.getByText("fghij-67890")).toBeTruthy();
    expect(screen.getByText("JBSW Y3DP EHPK 3PXP")).toBeTruthy();

    const verifyButton = screen.getByRole("button", {
      name: "Einrichtung abschließen",
    });
    expect(verifyButton).toHaveProperty("disabled", true);

    fireEvent.click(
      screen.getByLabelText("Ich habe die Wiederherstellungscodes sicher gespeichert."),
    );
    fireEvent.change(screen.getByLabelText("Ziffer 1 von 6"), {
      target: { value: "123456" },
    });

    expect(verifyButton).toHaveProperty("disabled", false);
    fireEvent.click(verifyButton);

    await screen.findByRole("heading", {
      name: "Mehrfachauthentifizierung aktiv",
    });

    // Recovery codes must disappear from the DOM after confirmation.
    expect(screen.queryByText("abcde-12345")).toBeNull();
    expect(screen.queryByText("fghij-67890")).toBeNull();

    const enableCall = fetchMock.mock.calls.find(([input]) =>
      String(input).endsWith("/two-factor/enable"),
    );
    expect(enableCall?.[1]?.body).toBe(
      JSON.stringify({ password: "Correct-Horse-Battery-2026" }),
    );

    await waitFor(() =>
      expect(window.location.pathname).toBe("/auth-v2/mfa/enroll"),
    );
  });

  it("verlangt das aktuelle Passwort vor der Einrichtung", async () => {
    installFetch([
      {
        path: "/api/auth-v2/account/me",
        reply: { body: accountMe({ role: "EMPLOYEE" }) },
      },
    ]);

    setPath("/auth-v2/mfa/enroll");
    render(<AuthV2App />);

    await screen.findByRole("heading", {
      name: "Mehrfachauthentifizierung einrichten",
    });
    fireEvent.click(screen.getByRole("button", { name: "Einrichtung starten" }));

    expect(
      await screen.findByText("Dieses Feld ist erforderlich."),
    ).toBeTruthy();
  });
});
