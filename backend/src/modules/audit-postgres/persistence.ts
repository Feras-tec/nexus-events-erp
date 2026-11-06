import { Prisma, type PrismaClient } from "../../generated/prisma/client.js";

export class AuditPersistenceError extends Error {
  constructor() { super("PostgreSQL audit persistence failed; caller must retry or escalate"); this.name = "AuditPersistenceError"; }
}
export type BusinessAuditInput = {
  eventId?: string; userId?: string; action: string; entityType: string; entityId?: string;
  details?: Prisma.InputJsonValue | null; ipAddress?: string;
};

// Bewusst kein globaler Client und kein Anschluss an den bisherigen MongoDB-Schreibpfad.
export async function persistPostgresAudit(db: Pick<PrismaClient, "auditLog">, input: BusinessAuditInput): Promise<string> {
  try {
    if (!input.action.trim() || !input.entityType.trim()) throw new Error("Invalid audit input");
    const { eventId, ...data } = input;
    // Die dauerhafte Geschäftsoperations-ID verhindert einen zweiten Audit-Eintrag derselben Operation.
    const row = await db.auditLog.create({ data: {
      ...data, ...(eventId ? { id: eventId } : {}), action: input.action.trim(), entityType: input.entityType.trim(),
      details: input.details === null ? Prisma.JsonNull : input.details,
    } });
    return row.id;
  } catch {
    // Keine Verbindungsdaten oder Nutzdaten protokollieren; der Fehler muss den Aufrufer erreichen.
    throw new AuditPersistenceError();
  }
}
