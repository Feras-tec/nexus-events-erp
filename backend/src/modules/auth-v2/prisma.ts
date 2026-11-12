import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

// Den optionalen Auth-V2-Client erst beim tatsächlichen Zugriff initialisieren.
// Clerk darf bei deaktiviertem Auth-V2 ohne dessen Datenbankkonfiguration starten.
let client: PrismaClient | undefined;
export function getAuthV2Prisma(): PrismaClient {
  if (!client) {
    // Kein Rückgriff auf DATABASE_URL oder DIRECT_URL: fehlende Konfiguration bleibt ein Fehler.
    const connectionString = process.env["AUTH_V2_DATABASE_URL"];
    if (!connectionString) {
      throw new Error("AUTH_V2_DATABASE_URL is required when the auth-v2 module is loaded");
    }
    client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  }
  return client;
}

// Bestehende Aufrufer behalten ihre Prisma-Schnittstelle und den korrekten Methodenkontext.
export const authV2Prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const instance = getAuthV2Prisma();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export type AuthV2Prisma = typeof authV2Prisma;
