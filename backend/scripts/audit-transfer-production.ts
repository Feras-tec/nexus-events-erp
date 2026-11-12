import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import pg from "pg";
import mongoose from "mongoose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { mongoAuditSource } from "../src/modules/audit-postgres/mongo-source.js";
import { transferAudits, AuditTransferError } from "../src/modules/audit-postgres/transfer.js";
import { EXPECTED_TRANSFER_TARGET as expected, validateTransferApproval, validateTransferUrls, requireReadOnlyMongoPrivileges, TransferGuardError } from "../src/modules/audit-postgres/production-guard.js";

let metadata: pg.Client | undefined, mongo: mongoose.mongo.MongoClient | undefined, db: PrismaClient | undefined;
try {
  // Keine dotenv-Datei und kein allgemeiner URL-Fallback; vor jeder Verbindung eine explizite T1-Freigabe prüfen.
  if (process.argv[2] !== "--execute" || !process.env.AUDIT_TRANSFER_APPROVAL_FILE) throw new TransferGuardError("EXPLICIT_APPROVAL_REQUIRED");
  const approval = validateTransferApproval(await readFile(process.env.AUDIT_TRANSFER_APPROVAL_FILE, "utf8"), process.env.AUDIT_TRANSFER_APPROVAL_SHA256, process.env.AUDIT_TRANSFER_EXECUTE);
  const urls = validateTransferUrls(process.env.AUDIT_TRANSFER_DATABASE_URL, process.env.AUDIT_TRANSFER_MONGODB_URI);
  metadata = new pg.Client({ connectionString: urls.target, ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 10000,
    options: "-c default_transaction_read_only=on -c statement_timeout=15000 -c lock_timeout=3000" });
  await metadata.connect();
  if ((await metadata.query("SHOW default_transaction_read_only")).rows[0].default_transaction_read_only !== "on") throw new TransferGuardError("READ_ONLY_PREFLIGHT_REQUIRED");
  await metadata.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  if ((await metadata.query("SHOW transaction_read_only")).rows[0].transaction_read_only !== "on") throw new TransferGuardError("READ_ONLY_PREFLIGHT_REQUIRED");
  const identity = (await metadata.query("SELECT current_database() AS db,current_setting('neon.project_id',true) AS project,current_setting('neon.branch_id',true) AS branch")).rows[0];
  if (identity.db !== expected.database || identity.project !== expected.projectId || identity.branch !== expected.branchId) throw new TransferGuardError("TARGET_IDENTITY_REJECTED");
  const owner = (await metadata.query('SELECT role,"isActive",("clerkUserId" IS NOT NULL) AS linked FROM "AppUser" WHERE id=$1 AND email=$2', [expected.ownerId, "fr0000911@gmail.com"])).rows;
  if (owner.length !== 1 || owner[0].role !== "OWNER" || !owner[0].isActive || !owner[0].linked) throw new TransferGuardError("OWNER_INVARIANT_REJECTED");
  const migrationRoot = new URL("../prisma/migrations/", import.meta.url);
  const names = (await readdir(migrationRoot, { withFileTypes: true })).filter(f => f.isDirectory()).map(f => f.name).sort();
  const hashes: [string, string][] = [];
  for (const name of names) hashes.push([name, createHash("sha256").update(await readFile(new URL(`${name}/migration.sql`, migrationRoot))).digest("hex")]);
  if (hashes.length !== 22 || createHash("sha256").update(JSON.stringify(hashes)).digest("hex") !== "204a16956dd30c6c96cce8973208ec23b11de53afa0be985ad92e73827318907") throw new TransferGuardError("LOCAL_MIGRATION_BUNDLE_REJECTED");
  const applied = (await metadata.query('SELECT migration_name,checksum FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL')).rows;
  if (applied.length !== hashes.length || hashes.some(([name, hash]) => !applied.some(row => row.migration_name === name && row.checksum === hash))) throw new TransferGuardError("APPLIED_MIGRATION_BUNDLE_REJECTED");
  const role = (await metadata.query("SELECT rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls FROM pg_roles WHERE rolname=current_user")).rows[0];
  const writableOutsideAudit = (await metadata.query(`SELECT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname NOT IN ('AuditLog','AuditLogTransfer') AND (has_table_privilege(c.oid,'INSERT') OR has_table_privilege(c.oid,'UPDATE') OR has_table_privilege(c.oid,'DELETE') OR has_table_privilege(c.oid,'TRUNCATE'))) AS writable`)).rows[0].writable;
  if (!role || Object.values(role).some(Boolean) || writableOutsideAudit) throw new TransferGuardError("NARROW_POSTGRES_WRITER_REQUIRED");
  if ((await metadata.query('SELECT count(*)::int AS n FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL')).rows[0].n) throw new TransferGuardError("FAILED_MIGRATION_PRESENT");
  await metadata.query("ROLLBACK"); await metadata.end(); metadata = undefined;
  mongo = new mongoose.mongo.MongoClient(urls.source, { tls: true, tlsAllowInvalidCertificates: false, tlsAllowInvalidHostnames: false, maxPoolSize: 1, serverSelectionTimeoutMS: 10000 });
  await mongo.connect();
  requireReadOnlyMongoPrivileges(await mongo.db().command({ connectionStatus: 1, showPrivileges: true }));
  const source = mongoAuditSource(mongo.db().collection(expected.sourceCollection));
  const before = await source.snapshot();
  if (before.count !== approval.expectedCount || before.upperId !== approval.upperId) throw new TransferGuardError("FROZEN_SOURCE_MANIFEST_MISMATCH");
  if (Date.parse(approval.expiresAt) <= Date.now()) throw new TransferGuardError("APPROVAL_EXPIRED");
  db = new PrismaClient({ adapter: new PrismaPg({ connectionString: urls.target, ssl: { rejectUnauthorized: true } }) });
  const sourceKey = `mongodb.${expected.sourceHostHash}.${expected.sourceDatabase}.${expected.sourceCollection}`;
  const checkpoint = await db.auditLogTransfer.findUnique({ where: { sourceKey } });
  if (checkpoint && (checkpoint.expectedCount !== approval.expectedCount || checkpoint.snapshotUpperId !== approval.upperId)) throw new TransferGuardError("CHECKPOINT_MANIFEST_MISMATCH");
  // Ausschließlich AuditLog und Kontrollpunkte schreiben; keine Migration, Kontenänderung oder MongoDB-Schreiboperation.
  const result = await transferAudits(db, source, sourceKey);
  const after = await source.snapshot();
  if (after.count !== before.count || after.upperId !== before.upperId) {
    await db.auditLogTransfer.update({ where: { sourceKey }, data: { status: "FAILED" } });
    throw new TransferGuardError("SOURCE_CHANGED_DURING_TRANSFER");
  }
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(JSON.stringify({ status: "FAILED", code: error instanceof TransferGuardError || error instanceof AuditTransferError ? error.code : "TRANSFER_PREFLIGHT_OR_DATABASE_FAILED" }));
  process.exitCode = 1;
} finally {
  // Auch Fehler beim Schließen dürfen keine ungefilterten Treiber- oder Verbindungsdaten ausgeben.
  const remainingMetadata = metadata;
  const cleanup = await Promise.allSettled([
    db?.$disconnect(), mongo?.close(),
    remainingMetadata ? (async () => { await remainingMetadata.query("ROLLBACK").catch(() => undefined); await remainingMetadata.end(); })() : undefined,
  ]);
  if (cleanup.some(result => result.status === "rejected")) {
    console.error(JSON.stringify({ status: "FAILED", code: "TRANSFER_CLEANUP_FAILED" }));
    process.exitCode = 1;
  }
}
