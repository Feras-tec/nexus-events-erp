const API_URL = import.meta.env.VITE_API_URL;

// Anfrage an das Backend mit Clerk-Token senden
export async function apiFetch(
  path: string,
  token: string | null,
  options: RequestInit = {},
) {
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API-Fehler: ${response.status}`);
  }

  return response;
}
