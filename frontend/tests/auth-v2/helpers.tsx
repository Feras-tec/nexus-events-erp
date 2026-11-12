import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import i18n from "../../src/i18n/config";

export type MockReply = {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
};

export type MockRoute = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  path: string | RegExp;
  reply: MockReply | ((init: RequestInit) => MockReply);
};

export function jsonReply({
  status = 200,
  body = null,
  headers = {},
}: MockReply = {}): Response {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name: string) {
        return normalized[name.toLowerCase()] ?? null;
      },
    },
    text: async () => (body === null ? "" : JSON.stringify(body)),
    json: async () => body,
  } as unknown as Response;
}

/**
 * Strict fetch double: any unexpected call fails loudly so a test can never
 * silently pass against an unmocked endpoint.
 */
export function installFetch(routes: MockRoute[]) {
  const mock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const raw = typeof input === "string" ? input : input.toString();
    const path = raw.replace(/^https?:\/\/[^/]+/, "");
    const method = (init.method ?? "GET").toUpperCase();
    if(path === "/api/auth/mode") return jsonReply({body:{mode:"auth-v2"}});

    for (const route of routes) {
      if (route.method && route.method !== method) continue;
      const matches =
        typeof route.path === "string"
          ? path === route.path
          : route.path.test(path);
      if (!matches) continue;
      const reply =
        typeof route.reply === "function" ? route.reply(init) : route.reply;
      return jsonReply(reply);
    }

    throw new Error(`Unhandled fetch in auth-v2 test: ${method} ${path}`);
  });

  vi.stubGlobal("fetch", mock);
  return mock;
}

export function sessionUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    email: "owner@nexus.test",
    name: "Test Owner",
    role: "OWNER",
    isActive: true,
    twoFactorEnabled: false,
    twoFactorRequired: false,
    twoFactorEnforcedAt: null,
    ...overrides,
  };
}

export function sessionRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "session-current",
    createdAt: new Date("2026-11-01T10:00:00Z").toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    reauthenticatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function accountMe(
  userOverrides: Record<string, unknown> = {},
  sessionOverrides: Record<string, unknown> = {},
) {
  return {
    user: sessionUser(userOverrides),
    session: sessionRecord(sessionOverrides),
  };
}

export const unauthenticated: MockReply = {
  status: 401,
  body: { error: "UNAUTHENTICATED" },
};

export function setPath(path: string) {
  window.history.replaceState({}, "", path);
}

/**
 * Labels with `required` include a visually hidden-in-a11y asterisk. Testing
 * Library still reads it, so match the label plus its optional marker.
 */
export function fieldLabel(text: string): RegExp {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}\\s*\\*?$`);
}

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  localStorage.clear();
  document.documentElement.lang = "de";
  document.documentElement.dir = "ltr";

  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

afterEach(async () => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  await i18n.changeLanguage("de");
});
