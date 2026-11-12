const DATE_TIME: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

export function formatDateTime(
  value: string | Date | null | undefined,
  locale: string,
): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(locale, DATE_TIME).format(date);
  } catch {
    return date.toISOString();
  }
}

export function formatDate(
  value: string | Date | null | undefined,
  locale: string,
): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
  } catch {
    return date.toISOString();
  }
}

export function initials(name: string, email: string): string {
  const source = name.trim() || email.trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export type DeviceInfo = {
  browser: string | null;
  os: string | null;
  mobile: boolean;
};

/**
 * Best-effort, display-only user-agent parsing. The UI labels unknown values
 * through i18n instead of pretending to identify a device.
 */
export function parseUserAgent(userAgent: string | null | undefined): DeviceInfo {
  const ua = userAgent ?? "";
  if (!ua) return { browser: null, os: null, mobile: false };

  let browser: string | null = null;
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera\//.test(ua)) browser = "Opera";
  else if (/CriOS\//.test(ua)) browser = "Chrome";
  else if (/Chrome\//.test(ua) && !/Chromium\//.test(ua)) browser = "Chrome";
  else if (/FxiOS\/|Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && /Version\//.test(ua)) browser = "Safari";

  let os: string | null = null;
  if (/Windows NT/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Mac OS X|Macintosh/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";

  const mobile = /Mobile|Android|iPhone|iPod/.test(ua) && !/iPad|Tablet/.test(ua);

  return { browser, os, mobile };
}

/** Backend reauthentication window is 5 minutes by default. */
export const REAUTH_WINDOW_MS = 5 * 60 * 1000;

export function isRecentAuthentication(
  reauthenticatedAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!reauthenticatedAt) return false;
  const timestamp = new Date(reauthenticatedAt).getTime();
  if (Number.isNaN(timestamp)) return false;
  return now - timestamp <= REAUTH_WINDOW_MS;
}

export function isExpired(value: string | null | undefined, now = Date.now()): boolean {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return !Number.isNaN(timestamp) && timestamp <= now;
}
