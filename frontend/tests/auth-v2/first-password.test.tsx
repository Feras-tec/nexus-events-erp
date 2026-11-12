import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AuthV2App } from "../../src/features/auth-v2/AuthV2App";
import { fieldLabel, installFetch, setPath, unauthenticated } from "./helpers";

describe("existing OWNER first-password setup", () => {
  it("uses only the dedicated endpoint and removes mailbox token from address bar", async () => {
    const token = "a".repeat(64);
    const fetchMock = installFetch([
      { path: "/api/auth-v2/account/me", reply: unauthenticated },
      { method: "POST", path: "/api/auth-v2/first-password/complete", reply: { body: { status: true } } },
    ]);
    setPath(`/auth-v2/first-password#token=${token}`);
    render(<AuthV2App />);
    await screen.findByRole("heading", { name: "Set up your first password" });
    expect(window.location.hash).toBe("");
    const value = `Synthetic-${crypto.randomUUID()}`;
    fireEvent.change(screen.getByLabelText(fieldLabel("Neues Passwort")), { target: { value } });
    fireEvent.change(screen.getByLabelText(fieldLabel("Passwort bestätigen")), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Passwort speichern" }));
    await waitFor(() => expect(window.location.pathname).toBe("/auth-v2/signed-out"));
    const calls = fetchMock.mock.calls.filter(([input]) => String(input).endsWith("/first-password/complete"));
    expect(calls).toHaveLength(1);
    expect(JSON.parse(String(calls[0]?.[1]?.body))).toEqual({ token, newPassword: value });
    expect(fetchMock.mock.calls.some(([input]) => String(input).endsWith("/reset-password"))).toBe(false);
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes(token))).toBe(false);
  });
  it("does not accept first-password tokens from a query string", async () => {
    installFetch([{ path: "/api/auth-v2/account/me", reply: unauthenticated }]);
    setPath(`/auth-v2/first-password?token=${"b".repeat(64)}`);
    render(<AuthV2App />);
    expect(await screen.findByRole("heading", { name: "Link ungültig oder abgelaufen" })).toBeTruthy();
  });
});
