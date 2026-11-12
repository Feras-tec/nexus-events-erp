/**
 * Cookie-based auth-v2 API client.
 *
 * Security invariants:
 *  - every request uses `credentials: "include"`; the session token lives in an
 *    HttpOnly cookie and is never read by JavaScript
 *  - no Authorization header and no token storage
 *  - same-origin relative paths only
 *  - error objects never carry credentials or raw response bodies
 */

export const AUTH_V2_BASE_PATH = "/api/auth-v2";

export const SESSION_FAILURE_CODES = [
  "UNAUTHENTICATED",
  "ABSOLUTE_EXPIRED",
  "IDLE_EXPIRED",
  "ACCOUNT_INACTIVE",
] as const;

export type SessionFailureCode = (typeof SESSION_FAILURE_CODES)[number];

export function isSessionFailureCode(code: string): code is SessionFailureCode {
  return (SESSION_FAILURE_CODES as readonly string[]).includes(code);
}

export class AuthV2ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterSeconds: number | null;

  constructor(
    status: number,
    code: string,
    retryAfterSeconds: number | null = null,
  ) {
    super(code);
    this.name = "AuthV2ApiError";
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  get isSessionFailure(): boolean {
    return isSessionFailureCode(this.code);
  }

  get isRateLimited(): boolean {
    return this.status === 429 || this.code === "RATE_LIMITED";
  }

  get isOriginRejected(): boolean {
    return this.code === "INVALID_ORIGIN";
  }

  get isReauthRequired(): boolean {
    return this.code === "REAUTH_REQUIRED";
  }

  get isMfaEnrollmentRequired(): boolean {
    return this.code === "MFA_ENROLLMENT_REQUIRED";
  }
}

type ExpiryListener = (reason: SessionFailureCode) => void;

const expiryListeners = new Set<ExpiryListener>();

/**
 * The provider subscribes to this so a 401 from any mutation (not only the
 * session query) immediately moves the UI to the expired-session screen.
 */
export function subscribeToSessionExpiry(listener: ExpiryListener): () => void {
  expiryListeners.add(listener);
  return () => {
    expiryListeners.delete(listener);
  };
}

export function emitSessionExpiry(reason: SessionFailureCode) {
  for (const listener of expiryListeners) {
    try {
      listener(reason);
    } catch {
      // A broken listener must never hide the original API error.
    }
  }
}

// ERP-MFA-Antworten lösen eine erneute autoritative Sitzungsprüfung aus.
const policyListeners = new Set<() => void>();
export function subscribeToSessionPolicy(listener: () => void): () => void {
  policyListeners.add(listener);
  return () => { policyListeners.delete(listener); };
}
export function notifyMfaEnrollmentRequired() {
  for (const listener of policyListeners) listener();
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /**
   * Public credential endpoints may legitimately answer 401 (wrong password or
   * wrong TOTP). They must not be treated as an expired session.
   */
  publicCredentialEndpoint?: boolean;
  /**
   * The bootstrap session probe handles 401 itself (anonymous vs. expired) and
   * must not push the global UI into the expired state.
   */
  suppressSessionExpiry?: boolean;
};

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return Math.ceil(seconds);
}

function extractErrorCode(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record["error"] === "string" && record["error"].length > 0) {
      return record["error"];
    }
    if (typeof record["code"] === "string" && record["code"].length > 0) {
      return record["code"];
    }
  }
  return `HTTP_${status}`;
}

/**
 * Reads a JSON body without ever surfacing it in an error. Auth-v2 responses
 * are sanitised server-side, but the client still refuses to attach them to
 * errors so accidental logging cannot leak account data.
 */
async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function authV2Request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${AUTH_V2_BASE_PATH}${path}`, {
      method,
      headers,
      body,
      credentials: "include",
      cache: "no-store",
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new AuthV2ApiError(0, "NETWORK_ERROR");
  }

  const payload = await readJson(response);

  if (!response.ok) {
    const code = extractErrorCode(payload, response.status);
    const retryAfter = parseRetryAfter(response.headers.get("Retry-After"));

    if (
      !options.publicCredentialEndpoint &&
      !options.suppressSessionExpiry &&
      response.status === 401 &&
      isSessionFailureCode(code)
    ) {
      emitSessionExpiry(code);
    }

    throw new AuthV2ApiError(response.status, code, retryAfter);
  }

  return payload as T;
}

export function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value));
  }
  const rendered = search.toString();
  return rendered.length > 0 ? `?${rendered}` : "";
}
