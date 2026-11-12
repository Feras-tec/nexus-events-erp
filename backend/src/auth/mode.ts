export type AuthMode = "auth-v2" | "clerk";

// Ein Modus pro Prozess; alte explizite Flags bleiben als befristete Rollback-Auswahl kompatibel.
export function getAuthMode(env: Record<string, string | undefined> = process.env): AuthMode {
  const mode = env.AUTH_MODE;
  const legacy = env.AUTH_V2_ENABLED;
  if (mode !== undefined && mode !== "auth-v2" && mode !== "clerk") throw new Error("AUTH_MODE must be auth-v2 or clerk");
  if (legacy !== undefined && legacy !== "true" && legacy !== "false") throw new Error("AUTH_V2_ENABLED must be true or false");
  const resolved = mode ?? (legacy === "false" ? "clerk" : "auth-v2");
  if (legacy !== undefined && (legacy === "true") !== (resolved === "auth-v2")) throw new Error("Conflicting authentication mode configuration");
  return resolved;
}
