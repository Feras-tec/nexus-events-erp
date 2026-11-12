import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, cp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import pg from "pg";
import mongoose from "mongoose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { persistPostgresAudit, AuditPersistenceError } from "../src/modules/audit-postgres/persistence.js";
import { transferAudits, reconcileAudits, mapMongoAudit, type AuditSource } from "../src/modules/audit-postgres/transfer.js";
import { mongoAuditSource } from "../src/modules/audit-postgres/mongo-source.js";
import { requireLocalAuditUrl } from "../src/modules/audit-postgres/local-safety.js";
const database = `test_audit_2l_${Date.now()}_${process.pid}`;
const pgUrl = `postgresql://dci-student@127.0.0.1:55449/${database}`;
const mongoUrl = `mongodb://127.0.0.1:55579/${database}`;
const ObjectId = mongoose.mongo.ObjectId;
let db: PrismaClient, client: pg.Client, mongo: mongoose.mongo.MongoClient, mongoPid: number | undefined;
let serial = 0;
const evidence: Record<string, unknown> = {};
function fixture(extra: Record<string, unknown> = {}) {
  return { _id: new ObjectId(), action: "EQUIPMENT_MOVEMENT_CREATED", entityType: "InventoryItem", userId: "synthetic-original-owner", entityId: "synthetic-item", ipAddress: "192.0.2.1", details: { nested: { date: new Date("2020-01-01"), id: new ObjectId(), number: mongoose.mongo.Long.fromString("9007199254740993") } }, createdAt: new Date("2020-01-01T10:20:30.123Z"), updatedAt: new Date("2020-01-02T10:20:30.456Z"), ...extra };
}
async function source(docs: ReturnType<typeof fixture>[]) {
  const key = `synthetic-${++serial}`; const collection = mongo.db().collection(`audit_${serial}`);
  if (docs.length) await collection.insertMany(docs);
  return { key, collection, source: mongoAuditSource(collection) };
}
before(async () => {
  // Ausschließlich neue synthetische Datenbanken auf der bekannten lokalen Testinstanz erstellen.
  const admin = new pg.Client({ connectionString: "postgresql://dci-student@127.0.0.1:55449/postgres", connectionTimeoutMillis: 3000 });
  await admin.connect();
  try {
    const identity = (await admin.query("SELECT host(inet_server_addr()) AS host, inet_server_port() AS port")).rows[0];
    assert.equal(identity.host, "127.0.0.1"); assert.equal(identity.port, 55449);
    assert.equal((await admin.query("SELECT 1 FROM pg_database WHERE datname=$1", [database])).rowCount, 0);
    await admin.query(`CREATE DATABASE "${database}"`);
  } finally { await admin.end(); }
  client = new pg.Client({ connectionString: pgUrl }); await client.connect();
  assert.equal((await client.query("SELECT current_database() AS name")).rows[0].name, database);
  assert.equal((await client.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'")).rows[0].n, 0);
  const migrationEnv = { ...process.env, DOTENV_CONFIG_PATH: "/dev/null", AUDIT_TEST_DATABASE_URL: pgUrl, DATABASE_URL: pgUrl, DIRECT_URL: pgUrl, AUTH_V2_DATABASE_URL: pgUrl };
  const baseline = await mkdtemp(path.join(tmpdir(), "nexus-audit-2l-baseline-"));
  await cp("prisma/migrations", path.join(baseline, "migrations"), { recursive: true, filter: name => !name.includes("20261105220000_prepare_postgresql_audit") });
  await writeFile(path.join(baseline, "config.ts"), `import {createRequire} from 'node:module'; const {defineConfig}=createRequire(${JSON.stringify(path.resolve("package.json"))})('prisma/config'); export default defineConfig({schema:${JSON.stringify(path.resolve("prisma/schema.prisma"))},migrations:{path:${JSON.stringify(path.join(baseline,"migrations"))}},datasource:{url:process.env.AUDIT_TEST_DATABASE_URL}});`);
  assert.equal(spawnSync("./node_modules/.bin/prisma", ["migrate", "deploy", "--config", path.join(baseline,"config.ts")], { env: migrationEnv, encoding: "utf8" }).status, 0, "Synthetic 21-migration baseline failed");
  db = new PrismaClient({ adapter: new PrismaPg({ connectionString: pgUrl }) });
  const owner = await db.appUser.create({ data: { id: "synthetic-owner-preserved", role: "OWNER", isActive: true, email: "owner@audit-2l.invalid", clerkUserId: "synthetic-clerk-preserved" } });
  const company = await db.company.create({ data: { id: "synthetic-company-preserved", name: "Synthetic ERP" } });
  const branch = await db.branch.create({ data: { code: "SYN", name: "Synthetic branch", city: "Test", companyId: company.id } });
  const customer = await db.customer.create({ data: { customerNo: "SYN", companyName: "Synthetic customer" } });
  const event = await db.event.create({ data: { eventNo: "SYN", name: "Synthetic event", startDate: new Date("2027-01-01"), endDate: new Date("2027-01-02"), customerId: customer.id } });
  const preserved = { owner, company, branch, customer, event };
  const migration = spawnSync("./node_modules/.bin/prisma", ["migrate", "deploy", "--config", "prisma7.audit-local.config.ts"], { env: migrationEnv, encoding: "utf8" });
  assert.equal(migration.status, 0, "Disposable additive migration failed");
  assert.deepEqual({ owner: await db.appUser.findUniqueOrThrow({ where: { id: owner.id } }), company: await db.company.findUniqueOrThrow({ where: { id: company.id } }), branch: await db.branch.findUniqueOrThrow({ where: { id: branch.id } }), customer: await db.customer.findUniqueOrThrow({ where: { id: customer.id } }), event: await db.event.findUniqueOrThrow({ where: { id: event.id } }) }, preserved);
  evidence.syntheticOwnerAndErpPreserved = true;
  evidence.baselineMigrations = (await readdir(path.join(baseline,"migrations"))).filter(name => name !== "migration_lock.toml").length;
  const drift = spawnSync("./node_modules/.bin/prisma", ["migrate", "diff", "--from-config-datasource", "--to-schema", "prisma/schema.prisma", "--exit-code", "--config", "prisma7.audit-local.config.ts"], { env: migrationEnv, encoding: "utf8" });
  assert.equal(drift.status, 0, "Additive migration must match the Prisma schema before the safety marker is added");
  evidence.schemaDiffBeforeMarker = "EMPTY";
  await client.query("CREATE TABLE audit_2l_disposable_marker(purpose text NOT NULL)");
  await client.query("INSERT INTO audit_2l_disposable_marker VALUES ('synthetic-audit-2l')");
  const directory = await mkdtemp(path.join(tmpdir(), "nexus-audit-2l-mongo-"));
  const start = spawnSync("mongod", ["--dbpath", directory, "--port", "55579", "--bind_ip", "127.0.0.1", "--fork", "--logpath", path.join(directory, "mongo.log"), "--pidfilepath", path.join(directory, "mongo.pid")], { encoding: "utf8" });
  assert.equal(start.status, 0, "Dedicated synthetic mongod could not start; refusing to use another server");
  mongoPid = Number(await readFile(path.join(directory, "mongo.pid"), "utf8"));
  mongo = new mongoose.mongo.MongoClient(mongoUrl); await mongo.connect();
  await mongo.db().collection("disposable_marker").insertOne({ purpose: "synthetic-audit-2l" });
  evidence.database = database; evidence.mongoDataDirectory = directory;
});
after(async () => {
  await db?.$disconnect(); await client?.end(); await mongo?.close();
  if (mongoPid) process.kill(mongoPid, "SIGTERM");
  console.log("SYNTHETIC_AUDIT_EVIDENCE", JSON.stringify(evidence));
});
test("local URL guard rejects remote, ambiguous and non-test targets", () => {
  for (const value of [undefined, "postgresql://remote.invalid/test_audit_2l", "postgresql://127.0.0.1/neondb", "postgresql://127.0.0.1/test_audit_2l?host=remote", "mongodb+srv://localhost/test_audit_2l", "mongodb://127.0.0.1,remote/test_audit_2l"]) assert.throws(() => requireLocalAuditUrl(value, "postgres"));
  assert.equal(requireLocalAuditUrl(pgUrl, "postgres"), pgUrl); assert.equal(requireLocalAuditUrl(mongoUrl, "mongo"), mongoUrl);
});
test("additive migration creates separate business and security tables without actor FK", async () => {
  assert.equal((await client.query('SELECT count(*)::int AS n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL')).rows[0].n, 22);
  assert.equal((await client.query("SELECT count(*)::int AS n FROM information_schema.table_constraints WHERE table_name='AuditLog' AND constraint_type='FOREIGN KEY'")).rows[0].n, 0);
  assert.equal(await db.securityEvent.count(), 0);
});
test("native writer preserves actor without requiring live AppUser", async () => {
  const id = await persistPostgresAudit(db, { action: " UPDATE ", entityType: "Product", userId: "deleted-or-clerk-actor", details: { ok: true } });
  const row = await db.auditLog.findUniqueOrThrow({ where: { id } });
  assert.equal(row.userId, "deleted-or-clerk-actor"); assert.equal(row.action, "UPDATE"); assert.equal(row.sourceKey, null);
});
test("native writer propagates database and validation failures safely", async () => {
  const unavailable = { auditLog: { create: async () => { throw new Error("sensitive driver message"); } } } as unknown as PrismaClient;
  await assert.rejects(persistPostgresAudit(unavailable, { action: "A", entityType: "B" }), error => error instanceof AuditPersistenceError && !error.message.includes("sensitive"));
  await assert.rejects(persistPostgresAudit(db, { action: " ", entityType: "B" }), AuditPersistenceError);
});
test("native JSON null and omitted details are supported", async () => {
  for (const details of [undefined, null]) assert.ok(await persistPostgresAudit(db, { action: "READ", entityType: "Synthetic", details }));
});
test("historical transfer preserves IDs, actor, original timestamps and BSON", async () => {
  const doc = fixture(); const setup = await source([doc]); assert.equal((await transferAudits(db, setup.source, setup.key, 1)).verified, 1);
  const row = await db.auditLog.findFirstOrThrow({ where: { sourceKey: setup.key } });
  assert.equal(row.originalDocumentId, doc._id.toHexString()); assert.equal(row.userId, doc.userId);
  assert.equal(row.createdAt.toISOString(), doc.createdAt.toISOString()); assert.equal(row.updatedAt.toISOString(), doc.updatedAt.toISOString());
  assert.deepEqual(row.originalDocument, mongoose.mongo.BSON.EJSON.serialize(doc, { relaxed: false }));
});
test("successful rerun is idempotent without rewriting import timestamps", async () => {
  const setup = await source([fixture(), fixture(), fixture()]); await transferAudits(db, setup.source, setup.key, 2);
  const before = await db.auditLog.findMany({ where: { sourceKey: setup.key }, orderBy: { originalDocumentId: "asc" } });
  await transferAudits(db, setup.source, setup.key, 1);
  assert.deepEqual(await db.auditLog.findMany({ where: { sourceKey: setup.key }, orderBy: { originalDocumentId: "asc" } }), before);
});
test("interrupted transfer resumes from last committed batch", async () => {
  const setup = await source([fixture(), fixture(), fixture()]); let calls = 0;
  const interrupted: AuditSource = { ...setup.source, page: async (...args) => { if (++calls === 2) throw new Error("synthetic interruption"); return setup.source.page(...args); } };
  await assert.rejects(transferAudits(db, interrupted, setup.key, 1));
  assert.equal((await db.auditLogTransfer.findUniqueOrThrow({ where: { sourceKey: setup.key } })).processedCount, 1);
  assert.equal((await transferAudits(db, setup.source, setup.key, 1)).verified, 3);
});
test("invalid document aborts entire batch without advancing checkpoint", async () => {
  const setup = await source([fixture(), fixture({ action: "" })]); await assert.rejects(transferAudits(db, setup.source, setup.key, 2), /INVALID_action/);
  assert.equal(await db.auditLog.count({ where: { sourceKey: setup.key } }), 0);
  assert.equal((await db.auditLogTransfer.findUniqueOrThrow({ where: { sourceKey: setup.key } })).lastId, null);
});
test("database failure rolls back inserts and checkpoint atomically", async () => {
  const setup = await source([fixture(), fixture()]);
  await client.query(`CREATE FUNCTION audit_2l_reject() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."sourceKey"='${setup.key}' AND NEW."processedCount">0 THEN RAISE EXCEPTION 'synthetic failure'; END IF; RETURN NEW; END $$`);
  await client.query('CREATE TRIGGER audit_2l_reject BEFORE UPDATE ON "AuditLogTransfer" FOR EACH ROW EXECUTE FUNCTION audit_2l_reject()');
  try { await assert.rejects(transferAudits(db, setup.source, setup.key, 2)); }
  finally { await client.query('DROP TRIGGER audit_2l_reject ON "AuditLogTransfer"'); await client.query('DROP FUNCTION audit_2l_reject()'); }
  assert.equal(await db.auditLog.count({ where: { sourceKey: setup.key } }), 0);
  assert.equal((await db.auditLogTransfer.findUniqueOrThrow({ where: { sourceKey: setup.key } })).processedCount, 0);
});
test("source modifications fail reconciliation", async () => {
  const setup = await source([fixture()]); await transferAudits(db, setup.source, setup.key);
  await setup.collection.updateOne({}, { $set: { action: "CHANGED" } }); await assert.rejects(transferAudits(db, setup.source, setup.key), /RECONCILIATION_CONTENT/);
});
test("deleted source records fail count reconciliation", async () => {
  const setup = await source([fixture()]); await transferAudits(db, setup.source, setup.key);
  await setup.collection.deleteOne({}); await assert.rejects(transferAudits(db, setup.source, setup.key), /RECONCILIATION_COUNT/);
});
test("target changes fail reconciliation even with unchanged provenance hash", async () => {
  const setup = await source([fixture()]); await transferAudits(db, setup.source, setup.key);
  await db.auditLog.updateMany({ where: { sourceKey: setup.key }, data: { action: "TAMPERED" } });
  await assert.rejects(reconcileAudits(db, setup.source, setup.key), /RECONCILIATION_CONTENT/);
});
test("unique source and original ID protect against duplicates", async () => {
  const doc = fixture(); const setup = await source([doc]); await transferAudits(db, setup.source, setup.key);
  await assert.rejects(db.auditLog.create({ data: mapMongoAudit(doc, setup.key) })); assert.equal(await db.auditLog.count({ where: { sourceKey: setup.key } }), 1);
});
test("empty frozen source reconciles to zero", async () => { const setup = await source([]); assert.equal((await transferAudits(db, setup.source, setup.key)).verified, 0); });
test("unsupported IDs and missing original timestamps fail closed", () => {
  assert.throws(() => mapMongoAudit(fixture({ _id: "legacy-string" }), "synthetic"), /UNSUPPORTED_ID/);
  assert.throws(() => mapMongoAudit(fixture({ createdAt: undefined }), "synthetic"), /INVALID_createdAt/);
});
test("concurrent workers cannot duplicate or skip records", async () => {
  const setup = await source(Array.from({ length: 8 }, () => fixture()));
  const results = await Promise.allSettled([transferAudits(db, setup.source, setup.key, 1), transferAudits(db, setup.source, setup.key, 1)]);
  assert.ok(results.some(r => r.status === "fulfilled")); assert.equal((await transferAudits(db, setup.source, setup.key, 2)).verified, 8);
  assert.equal(await db.auditLog.count({ where: { sourceKey: setup.key } }), 8);
});
test("local command transfers twice without changing source documents", async () => {
  const docs = [fixture(), fixture()]; await mongo.db().collection("auditlogs").insertMany(docs);
  const env = { ...process.env, DOTENV_CONFIG_PATH: "/dev/null", AUDIT_TEST_DATABASE_URL: pgUrl, AUDIT_TEST_MONGODB_URI: mongoUrl, AUDIT_SYNTHETIC_ACK: "synthetic-disposable-only" };
  for (let i = 0; i < 2; i++) {
    const run = spawnSync(process.execPath, ["--import", "tsx", "scripts/audit-transfer-local.ts"], { env, encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr); assert.equal(JSON.parse(run.stdout).verified, 2);
  }
  assert.deepEqual(await mongo.db().collection("auditlogs").find().sort({ _id: 1 }).toArray(), docs);
});
test("missing optional fields and explicit null details survive import", async () => {
  const a = fixture({ userId: undefined, entityId: undefined, ipAddress: undefined, details: null });
  const b = fixture({ details: undefined });
  // Nicht vorhandene Felder vor dem Einfügen entfernen; MongoDB soll keine künstlichen Nullwerte erzeugen.
  for (const doc of [a,b]) for (const key of Object.keys(doc)) if ((doc as Record<string, unknown>)[key] === undefined) delete (doc as Record<string, unknown>)[key];
  const setup = await source([a,b]); assert.equal((await transferAudits(db, setup.source, setup.key)).verified, 2);
});
test("mapping errors report only safe code and original document ID", async () => {
  const doc = fixture({ action: "" }); const setup = await source([doc]);
  await assert.rejects(transferAudits(db, setup.source, setup.key), error => (error as { code: string; documentId: string }).code === "INVALID_action" && (error as { documentId: string }).documentId === doc._id.toHexString());
});
test("reconciliation failure invalidates earlier VERIFIED checkpoint", async () => {
  const setup = await source([fixture()]); await transferAudits(db, setup.source, setup.key);
  await db.auditLog.updateMany({ where: { sourceKey: setup.key }, data: { details: { changed: true } } });
  await assert.rejects(reconcileAudits(db, setup.source, setup.key));
  assert.equal((await db.auditLogTransfer.findUniqueOrThrow({ where: { sourceKey: setup.key } })).status, "FAILED");
});
test("a conflicting row before checkpoint advancement is rejected", async () => {
  const doc = fixture(); const setup = await source([doc]);
  await db.auditLog.create({ data: mapMongoAudit(fixture({ _id: doc._id, action: "OTHER" }), setup.key) });
  await assert.rejects(transferAudits(db, setup.source, setup.key), /SOURCE_CONFLICT/);
  assert.equal((await db.auditLogTransfer.findUniqueOrThrow({ where: { sourceKey: setup.key } })).processedCount, 0);
});
test("source namespace isolates identical document IDs in different sources", async () => {
  const doc = fixture(); const a = await source([doc]); const b = await source([doc]);
  await transferAudits(db, a.source, a.key); await transferAudits(db, b.source, b.key);
  assert.equal(await db.auditLog.count({ where: { originalDocumentId: doc._id.toHexString() } }), 2);
});
test("new documents above frozen upper ID are deliberately excluded", async () => {
  const setup = await source([fixture()]); await transferAudits(db, setup.source, setup.key);
  await setup.collection.insertOne(fixture());
  assert.equal((await transferAudits(db, setup.source, setup.key)).verified, 1);
});
test("Extended JSON preserves integer, double, decimal and binary BSON types", async () => {
  const BSON = mongoose.mongo.BSON;
  const doc = fixture({ userId: null, details: { int: new BSON.Int32(7), double: new BSON.Double(1), decimal: BSON.Decimal128.fromString("1.234567890123456789"), bytes: new BSON.Binary(Buffer.from([1,2,3])) } });
  const setup = await source([doc]); await transferAudits(db, setup.source, setup.key);
  const stored = await db.auditLog.findFirstOrThrow({ where: { sourceKey: setup.key } });
  assert.deepEqual(stored.originalDocument, BSON.EJSON.serialize(doc, { relaxed: false }));
  assert.equal(stored.userId, null);
});
