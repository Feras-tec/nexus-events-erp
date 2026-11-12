import { createHash, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { Prisma, type PrismaClient } from "../../generated/prisma/client.js";

const { EJSON, ObjectId } = mongoose.mongo.BSON;
export type SourceDocument = Record<string, unknown> & { _id: unknown };
export interface AuditSource {
  snapshot(): Promise<{ upperId: string | null; count: number }>;
  count(upperId: string | null): Promise<number>;
  page(afterId: string | null, upperId: string | null, size: number): Promise<SourceDocument[]>;
}
export class AuditTransferError extends Error {
  constructor(public readonly code: string, public readonly documentId?: string) { super(`Audit transfer stopped: ${code}`); this.name = "AuditTransferError"; }
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value).sort(([a],[b])=>a < b ? -1 : a > b ? 1 : 0).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
function text(doc: SourceDocument, key: string, required = false): string | undefined {
  const value = doc[key];
  if ((value === undefined || value === null) && !required) return undefined;
  if (typeof value !== "string" || (required && !value.trim())) throw new AuditTransferError(`INVALID_${key}`);
  return value;
}
export function mapMongoAudit(doc: SourceDocument, sourceKey: string) {
  // Kanonisches Extended JSON erhält BSON-Typen einschließlich verschachtelter ObjectIds und Datumswerte.
  if (!(doc._id instanceof ObjectId)) throw new AuditTransferError("UNSUPPORTED_ID");
  for (const key of ["createdAt", "updatedAt"]) {
    if (!(doc[key] instanceof Date) || !Number.isFinite((doc[key] as Date).getTime())) throw new AuditTransferError(`INVALID_${key}`);
  }
  const originalDocument = EJSON.serialize(doc, { relaxed: false }) as Prisma.InputJsonObject;
  return {
    sourceKey, originalDocumentId: doc._id.toHexString(),
    userId: text(doc, "userId"), action: text(doc, "action", true)!,
    entityType: text(doc, "entityType", true)!, entityId: text(doc, "entityId"),
    ipAddress: text(doc, "ipAddress"), createdAt: doc.createdAt as Date, updatedAt: doc.updatedAt as Date,
    details: doc.details === undefined ? Prisma.DbNull : doc.details === null ? Prisma.JsonNull : EJSON.serialize(doc.details, { relaxed: false }) as Prisma.InputJsonValue,
    originalDocument, sourceHash: createHash("sha256").update(canonical(originalDocument)).digest("hex"),
  };
}

export async function transferAudits(db: PrismaClient, source: AuditSource, sourceKey: string, batchSize = 100) {
  if (!/^[a-zA-Z0-9_.:-]{1,160}$/.test(sourceKey) || !Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1000) throw new AuditTransferError("INVALID_OPTIONS");
  // Jeder Lauf erhält eine Kennung; konkurrierende Seiten werden unten transaktional abgesichert.
  const runId = randomUUID();
  if (!await db.auditLogTransfer.findUnique({ where: { sourceKey } })) {
    const initial = await source.snapshot();
    await db.auditLogTransfer.upsert({ where: { sourceKey }, create: { sourceKey, snapshotUpperId: initial.upperId, expectedCount: initial.count }, update: {} });
  }
  await db.auditLogTransfer.update({ where: { sourceKey }, data: { status: "COPYING" } });
  for (;;) {
    const checkpoint = await db.auditLogTransfer.findUniqueOrThrow({ where: { sourceKey } });
    const page = await source.page(checkpoint.lastId, checkpoint.snapshotUpperId, batchSize);
    if (!page.length) break;
    const mapped = page.map(doc => {
      try { return mapMongoAudit(doc, sourceKey); }
      catch (error) {
        if (error instanceof AuditTransferError) throw new AuditTransferError(error.code, doc._id instanceof ObjectId ? doc._id.toHexString() : undefined);
        throw new AuditTransferError("DOCUMENT_ENCODING_FAILED", doc._id instanceof ObjectId ? doc._id.toHexString() : undefined);
      }
    });
    let previous = checkpoint.lastId ?? "";
    for (const row of mapped) {
      if (row.originalDocumentId <= previous || !checkpoint.snapshotUpperId || row.originalDocumentId > checkpoint.snapshotUpperId) throw new AuditTransferError("SOURCE_ORDER");
      previous = row.originalDocumentId;
    }
    await db.$transaction(async tx => {
      // Derselbe Kontrollpunkt darf nur von einer Transaktion fortgeschrieben werden.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${sourceKey}, 0))`;
      const current = await tx.auditLogTransfer.findUniqueOrThrow({ where: { sourceKey } });
      if (current.lastId !== checkpoint.lastId) throw new AuditTransferError("CONCURRENT_RUN");
      for (const row of mapped) {
        const existing = await tx.auditLog.findUnique({ where: { sourceKey_originalDocumentId: { sourceKey, originalDocumentId: row.originalDocumentId } } });
        if (existing && existing.sourceHash !== row.sourceHash) throw new AuditTransferError("SOURCE_CONFLICT");
        if (!existing) await tx.auditLog.create({ data: { ...row, importedAt: new Date() } });
      }
      await tx.auditLogTransfer.update({ where: { sourceKey }, data: { lastId: previous, processedCount: { increment: mapped.length }, status: "COPYING" } });
    });
  }
  const reconciliation = await reconcileAudits(db, source, sourceKey, batchSize);
  // Keine Nutzdaten oder Datenbankfehler im Ergebnis; die Prüfzahlen reichen für einen sicheren Bericht.
  return { runId, ...reconciliation };
}

export async function reconcileAudits(db: PrismaClient, source: AuditSource, sourceKey: string, batchSize = 100) {
  await db.auditLogTransfer.update({ where: { sourceKey }, data: { status: "VERIFYING" } });
  try { return await reconcileContent(db, source, sourceKey, batchSize); }
  catch (error) {
    // Ein älterer Erfolg darf nach erkannter Abweichung nicht weiterhin als gültig erscheinen.
    await db.auditLogTransfer.update({ where: { sourceKey }, data: { status: "FAILED" } });
    throw error;
  }
}
async function reconcileContent(db: PrismaClient, source: AuditSource, sourceKey: string, batchSize: number) {
  const checkpoint = await db.auditLogTransfer.findUniqueOrThrow({ where: { sourceKey } });
  let after: string | null = null, verified = 0;
  for (;;) {
    const page = await source.page(after, checkpoint.snapshotUpperId, batchSize);
    if (!page.length) break;
    for (const doc of page) {
      const mapped = mapMongoAudit(doc, sourceKey);
      const stored = await db.auditLog.findUnique({ where: { sourceKey_originalDocumentId: { sourceKey, originalDocumentId: mapped.originalDocumentId } } });
      // Auch manipulierte Zielspalten erkennen, nicht nur das gespeicherte Herkunftshash vergleichen.
      if (!stored || stored.sourceHash !== mapped.sourceHash || canonical(stored.originalDocument) !== canonical(mapped.originalDocument) ||
          stored.action !== mapped.action || stored.entityType !== mapped.entityType || stored.userId !== (mapped.userId ?? null) ||
          stored.entityId !== (mapped.entityId ?? null) || stored.ipAddress !== (mapped.ipAddress ?? null) ||
          stored.createdAt.getTime() !== mapped.createdAt.getTime() || stored.updatedAt.getTime() !== mapped.updatedAt.getTime() ||
          canonical(stored.details) !== canonical(doc.details === undefined ? null : EJSON.serialize(doc.details, { relaxed: false }))) throw new AuditTransferError("RECONCILIATION_CONTENT");
      if (mapped.originalDocumentId <= (after ?? "")) throw new AuditTransferError("SOURCE_ORDER");
      after = mapped.originalDocumentId; verified++;
    }
  }
  const targetCount = await db.auditLog.count({ where: { sourceKey } });
  const sourceCount = await source.count(checkpoint.snapshotUpperId);
  if (verified !== checkpoint.expectedCount || sourceCount !== verified || targetCount !== verified || checkpoint.processedCount !== verified) throw new AuditTransferError("RECONCILIATION_COUNT");
  await db.auditLogTransfer.update({ where: { sourceKey }, data: { status: "VERIFIED" } });
  return { status: "VERIFIED", expected: checkpoint.expectedCount, verified, targetCount };
}
