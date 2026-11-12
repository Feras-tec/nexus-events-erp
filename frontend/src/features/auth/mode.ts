export type AppAuthMode = "auth-v2" | "clerk";

// Auth-V2 ist der Standard; Clerk benötigt eine ausdrückliche Rollback-Auswahl.
export function resolveAuthMode(env: {VITE_AUTH_MODE?: string; VITE_AUTH_V2_ENABLED?: string}): AppAuthMode {
  const mode = env.VITE_AUTH_MODE;
  const legacy = env.VITE_AUTH_V2_ENABLED;
  if (mode !== undefined && mode !== "auth-v2" && mode !== "clerk") throw new Error("VITE_AUTH_MODE must be auth-v2 or clerk");
  if (legacy !== undefined && legacy !== "true" && legacy !== "false") throw new Error("VITE_AUTH_V2_ENABLED must be true or false");
  const selected = mode ?? (legacy === "false" ? "clerk" : "auth-v2");
  if (legacy !== undefined && (legacy === "true") !== (selected === "auth-v2")) throw new Error("Conflicting authentication mode configuration");
  return selected;
}
export const APP_AUTH_MODE = resolveAuthMode({VITE_AUTH_MODE:import.meta.env.VITE_AUTH_MODE,VITE_AUTH_V2_ENABLED:import.meta.env.VITE_AUTH_V2_ENABLED});
