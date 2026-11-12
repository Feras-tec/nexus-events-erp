import { APP_AUTH_MODE } from "../features/auth/mode";
import { emitSessionExpiry, isSessionFailureCode, notifyMfaEnrollmentRequired } from "../features/auth-v2/api/client";

const AUTH_V2_MODE = APP_AUTH_MODE === "auth-v2";

// In Auth-V2 mode the ERP API is reached through the same origin (relative
// paths) and authenticated via HttpOnly cookies. Clerk bearer tokens are never
// used, even if a Clerk session happens to exist.
const API_URL = AUTH_V2_MODE ? "" : import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(
    message: string,
    status: number,
    body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// Anfrage an das Backend mit Clerk-Token senden
export async function apiFetch(
  path: string,
  token: string | null,
  options: RequestInit = {},
) {
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token && !AUTH_V2_MODE) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: AUTH_V2_MODE ? "include" : options.credentials,
  });

  if (!response.ok) {
    let body: unknown = null;

    try {
      body = await response.clone().json();
    } catch {
      // Nicht-JSON-Antworten bleiben ohne Body.
    }

    // Auch ERP-Abfragen müssen abgelaufene oder widerrufene Sitzungen sofort melden.
    if (AUTH_V2_MODE && response.status === 401 && body && typeof body === "object") {
      const code = (body as Record<string, unknown>).error;
      if (typeof code === "string" && isSessionFailureCode(code)) emitSessionExpiry(code);
    }

    if (AUTH_V2_MODE && response.status === 403 && body && typeof body === "object" &&
        (body as Record<string, unknown>).error === "MFA_ENROLLMENT_REQUIRED") {
      notifyMfaEnrollmentRequired();
    }

    throw new ApiError(
      `API-Fehler: ${response.status}`,
      response.status,
      body,
    );
  }

  return response;
}
