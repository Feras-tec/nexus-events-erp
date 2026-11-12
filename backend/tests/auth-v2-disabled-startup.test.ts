import { spawnSync } from "node:child_process";
import { describe, expect, it } from "@jest/globals";

// Frische Prozesse ohne .env, Datenbankadressen oder externe Zugangsdaten verwenden.
function isolated(code: string, enabled = "false", authSecret?: string) {
  return spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", code], {
    cwd: process.cwd(),
    env: { PATH: process.env.PATH ?? "", NODE_ENV: "test", DOTENV_CONFIG_PATH: "/dev/null", AUTH_V2_ENABLED: enabled,
      CLERK_TELEMETRY_DISABLED: "1", ...(authSecret ? { AUTH_V2_AUTH_SECRET: authSecret } : {}) },
    encoding: "utf8", timeout: 20_000,
  });
}

describe("Optional Auth-V2 database initialization", () => {
  it("imports the Clerk application without any Auth-V2 database configuration", () => {
    const result = isolated('await import("./src/app.ts"); console.log("CLERK_ONLY_IMPORT_OK");');
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("CLERK_ONLY_IMPORT_OK");
  });
  it("still rejects an actual Auth-V2 database access without its explicit URL", () => {
    const result = isolated(`const {authV2Prisma}=await import("./src/modules/auth-v2/prisma.ts");
      try { await authV2Prisma.$connect(); process.exitCode=2; }
      catch(error) { if(error.message !== "AUTH_V2_DATABASE_URL is required when the auth-v2 module is loaded") throw error; console.log("EXPLICIT_URL_REQUIRED"); }`);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("EXPLICIT_URL_REQUIRED");
  });
  it("requires an explicit Auth-V2 URL at startup when the feature is enabled", () => {
    const result = isolated('await import("./src/app.ts");', "true", "phase-2h5-synthetic-secret-never-use-in-production");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("AUTH_V2_DATABASE_URL is required");
  });
  it("does not allow enabling Auth-V2 without its required runtime configuration", () => {
    const result = isolated('await import("./src/app.ts");', "true");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("AUTH_V2_AUTH_SECRET must be set");
  });
});
