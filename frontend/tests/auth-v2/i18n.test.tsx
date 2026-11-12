import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import i18n from "../../src/i18n/config";

const LOCALES = ["de", "en", "ar"] as const;

type Bundle = Record<string, unknown>;

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value as Bundle).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

function authV2Bundle(locale: (typeof LOCALES)[number]): Bundle {
  const bundle = i18n.getResourceBundle(locale, "translation") as Bundle;
  return bundle.authV2 as Bundle;
}

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

describe("Auth V2 Übersetzungen", () => {
  it("haben in Deutsch, Englisch und Arabisch identische Schlüssel", () => {
    const reference = flattenKeys(authV2Bundle("de")).sort();

    for (const locale of ["en", "ar"] as const) {
      expect(flattenKeys(authV2Bundle(locale)).sort()).toEqual(reference);
    }

    expect(reference.length).toBeGreaterThan(150);
  });

  it("enthalten keine leeren Übersetzungen", () => {
    for (const locale of LOCALES) {
      const flat = flattenKeys(authV2Bundle(locale));
      for (const key of flat) {
        const value = key
          .split(".")
          .reduce<unknown>(
            (current, part) =>
              current && typeof current === "object"
                ? (current as Bundle)[part]
                : undefined,
            authV2Bundle(locale),
          );
        expect(typeof value, `${locale}:${key}`).toBe("string");
        expect(String(value).trim().length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("decken alle statisch referenzierten authV2-Schlüssel ab", () => {
    const root = join(process.cwd(), "src", "features", "auth-v2");
    const files = [
      ...collectSourceFiles(root),
      join(process.cwd(), "src", "auth-v2-entry.tsx"),
    ];

    const keys = new Set<string>();
    const pattern = /["'](authV2\.[A-Za-z0-9_.-]+)["']/g;
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      for (const match of content.matchAll(pattern)) {
        keys.add(match[1]!);
      }
    }

    expect(keys.size).toBeGreaterThan(80);

    for (const locale of LOCALES) {
      const available = new Set(
        flattenKeys(authV2Bundle(locale)).map((key) => `authV2.${key}`),
      );
      const missing = [...keys].filter((key) => !available.has(key));
      expect(missing, `${locale} fehlt`).toEqual([]);
    }
  });
});
