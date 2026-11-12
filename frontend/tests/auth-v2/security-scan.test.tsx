import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "src", "features", "auth-v2");

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const full = join(directory, entry);
    return statSync(full).isDirectory()
      ? collectSourceFiles(full)
      : full.endsWith(".ts") || full.endsWith(".tsx")
        ? [full]
        : [];
  });
}

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), "src", relativePath), "utf8");
}

describe("Auth V2 Sicherheitsinvarianten im Quelltext", () => {
  const files = collectSourceFiles(ROOT);

  it("enthält keinen Clerk-Import und keine Clerk-Nutzung", () => {
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      expect(content, relative(process.cwd(), file)).not.toMatch(/@clerk/);
    }
  });

  it("speichert keine Authentifizierungsdaten im Web Storage", () => {
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      expect(content, relative(process.cwd(), file)).not.toMatch(
        /\b(localStorage|sessionStorage)\b/,
      );
      expect(content, relative(process.cwd(), file)).not.toMatch(
        /document\.cookie/,
      );
    }
  });

  it("setzt keinen Authorization-Header und liest keine Cookies", () => {
    const client = source("features/auth-v2/api/client.ts");
    expect(client).toMatch(/credentials:\s*"include"/);
    expect(client).toMatch(/cache:\s*"no-store"/);
    expect(client).not.toMatch(/Authorization\s*:/);
    expect(client).not.toMatch(/document\.cookie/);
  });

  it("protokolliert keine Anmeldedaten oder Wiederherstellungscodes", () => {
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      expect(content, relative(process.cwd(), file)).not.toMatch(
        /console\.(log|info|warn|error|debug|trace)/,
      );
    }
  });

  it("rendert Wiederherstellungscodes nur im Einrichtungsbildschirm", () => {
    const pages = files.filter((file) => file.includes(`${join("pages", "")}`));
    const withCodes = pages.filter((file) =>
      readFileSync(file, "utf8").includes("RecoveryCodeList"),
    );
    expect(withCodes.map((file) => relative(process.cwd(), file))).toEqual([
      join("src", "features", "auth-v2", "pages", "MfaEnrollmentPage.tsx"),
    ]);
  });
});
