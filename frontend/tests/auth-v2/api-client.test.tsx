import { describe, expect, it, vi } from "vitest";

import {
  AUTH_V2_BASE_PATH,
  AuthV2ApiError,
  authV2Request,
  subscribeToSessionExpiry,
} from "../../src/features/auth-v2/api/client";
import { authV2Api } from "../../src/features/auth-v2/api";
import { installFetch } from "./helpers";

describe("Auth V2 API-Client", () => {
  it("nutzt relative Pfade, Cookies und niemals Authorization-Header", async () => {
    const fetchMock = installFetch([
      { path: "/api/auth-v2/account/me", reply: { body: { user: {}, session: {} } } },
    ]);

    await authV2Request("/account/me");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, init] = fetchMock.mock.calls[0]!;
    expect(input).toBe(`${AUTH_V2_BASE_PATH}/account/me`);
    expect(init?.credentials).toBe("include");
    expect(init?.cache).toBe("no-store");
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
    expect(headers.authorization).toBeUndefined();
  });

  it("sendet JSON-Bodies nur bei Bedarf", async () => {
    const fetchMock = installFetch([
      { method: "POST", path: "/api/auth-v2/sign-in/email", reply: { body: {} } },
      { path: "/api/auth-v2/account/me", reply: { body: {} } },
    ]);

    await authV2Api.signInEmail({ email: "a@b.de", password: "secret" });
    await authV2Request("/account/me");

    const postHeaders = fetchMock.mock.calls[0]![1]?.headers as Record<string, string>;
    expect(postHeaders["Content-Type"]).toBe("application/json");
    expect(fetchMock.mock.calls[0]![1]?.body).toBe(
      JSON.stringify({ email: "a@b.de", password: "secret" }),
    );

    const getHeaders = fetchMock.mock.calls[1]![1]?.headers as Record<string, string>;
    expect(getHeaders["Content-Type"]).toBeUndefined();
    expect(fetchMock.mock.calls[1]![1]?.body).toBeUndefined();
  });

  it("bildet Fehlercodes und Retry-After ab, ohne Antwortinhalte zu übernehmen", async () => {
    installFetch([
      {
        method: "POST",
        path: "/api/auth-v2/sign-in/email",
        reply: {
          status: 429,
          body: { error: "RATE_LIMITED", secret: "should-not-leak" },
          headers: { "Retry-After": "42" },
        },
      },
    ]);

    const error = await authV2Api
      .signInEmail({ email: "a@b.de", password: "secret" })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AuthV2ApiError);
    const apiError = error as AuthV2ApiError;
    expect(apiError.status).toBe(429);
    expect(apiError.code).toBe("RATE_LIMITED");
    expect(apiError.retryAfterSeconds).toBe(42);
    expect(apiError.isRateLimited).toBe(true);
    expect(apiError.message).toBe("RATE_LIMITED");
    expect(JSON.stringify(apiError)).not.toContain("should-not-leak");
  });

  it("meldet Netzwerkfehler als NETWORK_ERROR", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );

    await expect(authV2Request("/account/me")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      status: 0,
    });
  });

  it("meldet abgelaufene Sitzungen nur für geschützte Endpunkte", async () => {
    const reasons: string[] = [];
    const unsubscribe = subscribeToSessionExpiry((reason) => reasons.push(reason));

    installFetch([
      {
        path: "/api/auth-v2/sessions",
        reply: { status: 401, body: { error: "IDLE_EXPIRED" } },
      },
      {
        method: "POST",
        path: "/api/auth-v2/two-factor/verify-totp",
        reply: { status: 401, body: { error: "INVALID_CODE" } },
      },
      {
        path: "/api/auth-v2/get-session",
        reply: { status: 401, body: { error: "UNAUTHENTICATED" } },
      },
    ]);

    await expect(authV2Api.listSessions()).rejects.toMatchObject({
      code: "IDLE_EXPIRED",
    });
    expect(reasons).toEqual(["IDLE_EXPIRED"]);

    // Public credential endpoints must never be treated as an expiry.
    await expect(
      authV2Api.verifyTotp({ code: "123456" }),
    ).rejects.toMatchObject({ code: "INVALID_CODE" });

    // The bootstrap probe resolves anonymous/expired itself.
    await expect(authV2Api.getSession()).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });

    expect(reasons).toEqual(["IDLE_EXPIRED"]);
    unsubscribe();
  });

  it("behandelt eine leere Erfolgsantwort als null", async () => {
    installFetch([
      { method: "POST", path: "/api/auth-v2/sign-out", reply: { status: 200, body: null } },
    ]);

    await expect(authV2Api.signOut()).resolves.toBeNull();
  });
});
