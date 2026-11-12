import { useQueryClient } from "@tanstack/react-query";
import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { authV2Api } from "../../src/features/auth-v2/api";
import {
  AuthV2Provider,
  useAuthV2,
} from "../../src/features/auth-v2/context/AuthV2Provider";
import {
  accountMe,
  installFetch,
  sessionUser,
  unauthenticated,
} from "./helpers";

function Probe() {
  const { status, user, reason, logout, refresh } = useAuthV2();
  const client = useQueryClient();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="email">{user?.email ?? ""}</span>
      <span data-testid="reason">{reason ?? ""}</span>
      <button
        type="button"
        onClick={() => {
          void authV2Api.listSessions().catch(() => undefined);
        }}
      >
        expire
      </button>
      <button type="button" onClick={() => void refresh()}>refresh</button>
      <button type="button" onClick={() => client.setQueryData(["erp-private"], "previous-account")}>seed-private</button>
      <button type="button" onClick={() => { expect(client.getQueryData(["erp-private"])).toBeUndefined(); }}>check-private-empty</button>
      <button type="button" onClick={() => void logout()}>
        logout
      </button>
    </div>
  );
}

function renderProvider() {
  return render(
    <StrictMode><AuthV2Provider>
      <Probe />
    </AuthV2Provider></StrictMode>,
  );
}

describe("Auth V2 Zustandsableitung", () => {
  it("leitet eine authentifizierte Sitzung aus account/me ab", async () => {
    installFetch([
      { path: "/api/auth-v2/account/me", reply: { body: accountMe() } },
    ]);

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("authenticated"),
    );
    expect(screen.getByTestId("email").textContent).toBe("owner@nexus.test");
  });

  it("behandelt 401 UNAUTHENTICATED als anonym, nicht als abgelaufen", async () => {
    installFetch([
      { path: "/api/auth-v2/account/me", reply: unauthenticated },
    ]);

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("anonymous"),
    );
    expect(screen.getByTestId("reason").textContent).toBe("");
  });

  it("fällt bei MFA-Pflicht auf get-session zurück", async () => {
    installFetch([
      {
        path: "/api/auth-v2/account/me",
        reply: { status: 403, body: { error: "MFA_ENROLLMENT_REQUIRED" } },
      },
      {
        path: "/api/auth-v2/get-session",
        reply: {
          body: {
            user: sessionUser({ twoFactorRequired: true }),
            session: accountMe().session,
          },
        },
      },
    ]);

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe(
        "mfa-enrollment-required",
      ),
    );
    expect(screen.getByTestId("email").textContent).toBe("owner@nexus.test");
  });

  it("meldet absolute oder idle abgelaufene Sitzungen mit Grund", async () => {
    installFetch([
      {
        path: "/api/auth-v2/account/me",
        reply: { status: 401, body: { error: "ABSOLUTE_EXPIRED" } },
      },
    ]);

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("expired"),
    );
    expect(screen.getByTestId("reason").textContent).toBe("ABSOLUTE_EXPIRED");
  });

  it("reagiert auf einen globalen 401 einer beliebigen geschützten Anfrage", async () => {
    installFetch([
      { path: "/api/auth-v2/account/me", reply: { body: accountMe() } },
      {
        path: "/api/auth-v2/sessions",
        reply: { status: 401, body: { error: "IDLE_EXPIRED" } },
      },
    ]);

    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("authenticated"),
    );

    fireEvent.click(screen.getByRole("button", { name: "expire" }));

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("expired"),
    );
    expect(screen.getByTestId("reason").textContent).toBe("IDLE_EXPIRED");
  });

  it("räumt den Cache beim Abmelden auf", async () => {
    installFetch([
      { path: "/api/auth-v2/account/me", reply: { body: accountMe() } },
      { method: "POST", path: "/api/auth-v2/sign-out", reply: { body: { status: true } } },
    ]);

    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("authenticated"),
    );

    fireEvent.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("anonymous"),
    );
    expect(screen.getByTestId("email").textContent).toBe("");
  });
});

// StrictMode und dieselbe Provider-Instanz müssen Logout und erneute Anmeldung überleben.
it("aktualisiert die beobachtete Identität nach Logout und Kontowechsel weiterhin", async () => {
  let identity: ReturnType<typeof accountMe> | null = accountMe();
  installFetch([
    {path:'/api/auth-v2/account/me',reply:() => identity ? {body:identity} : unauthenticated},
    {method:'POST',path:'/api/auth-v2/sign-out',reply:() => { identity=null;return {body:{status:true}}; }},
  ]);
  renderProvider();
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authenticated'));
  fireEvent.click(screen.getByRole('button',{name:'seed-private'}));
  fireEvent.click(screen.getByRole('button',{name:'logout'}));
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('anonymous'));
  expect(screen.getByTestId('email').textContent).toBe('');
  fireEvent.click(screen.getByRole('button',{name:'check-private-empty'}));
  identity=accountMe();identity.user={...identity.user,id:'second-account',email:'second@nexus.test'};
  fireEvent.click(screen.getByRole('button',{name:'refresh'}));
  await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('second@nexus.test'));
  fireEvent.click(screen.getByRole('button',{name:'seed-private'}));
  identity=accountMe();
  fireEvent.click(screen.getByRole('button',{name:'refresh'}));
  await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('owner@nexus.test'));
  fireEvent.click(screen.getByRole('button',{name:'check-private-empty'}));
});
