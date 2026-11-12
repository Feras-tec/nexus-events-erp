import pg from "pg";
import mongoose from "mongoose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { requireLocalAuditUrl } from "../src/modules/audit-postgres/local-safety.js";
import { mongoAuditSource } from "../src/modules/audit-postgres/mongo-source.js";
import { transferAudits, AuditTransferError } from "../src/modules/audit-postgres/transfer.js";

// Dieses Vorbereitungswerkzeug ist absichtlich auf markierte synthetische lokale Datenbanken beschränkt.
// Für echte Quellen sind eine eigene Freigabe, ein eingefrorener Datenbestand und Leserechte erforderlich.
let postgres: pg.Client | undefined;
let mongo: mongoose.mongo.MongoClient | undefined;
let db: PrismaClient | undefined;
try {
  const pgUrl = requireLocalAuditUrl(process.env.AUDIT_TEST_DATABASE_URL, "postgres");
  const mongoUrl = requireLocalAuditUrl(process.env.AUDIT_TEST_MONGODB_URI, "mongo");
  if (process.env.AUDIT_SYNTHETIC_ACK !== "synthetic-disposable-only") throw new Error("Synthetic acknowledgment required");
  postgres = new pg.Client({ connectionString: pgUrl }); await postgres.connect();
  const identity = (await postgres.query("SELECT current_database() AS name, host(inet_server_addr()) AS host, pg_is_in_recovery() AS recovery")).rows[0];
  if (identity.name !== new URL(pgUrl).pathname.slice(1) || !["127.0.0.1", "::1"].includes(identity.host) || identity.recovery) throw new Error("Local target identity rejected");
  const marker = (await postgres.query("SELECT purpose FROM audit_2l_disposable_marker")).rows;
  if (marker.length !== 1 || marker[0].purpose !== "synthetic-audit-2l") throw new Error("Disposable target marker required");
  mongo = new mongoose.mongo.MongoClient(mongoUrl); await mongo.connect();
  const sourceDb = mongo.db();
  const sourceMarker = await sourceDb.collection("disposable_marker").findOne({ purpose: "synthetic-audit-2l" });
  if (!sourceMarker) throw new Error("Synthetic source marker required");
  db = new PrismaClient({ adapter: new PrismaPg({ connectionString: pgUrl }) });
  const result = await transferAudits(db, mongoAuditSource(sourceDb.collection("auditlogs")), process.env.AUDIT_SOURCE_KEY ?? "synthetic-local.auditlogs");
  console.log(JSON.stringify(result));
} catch (error) {
  // Datenbanktreiber können Geheimnisse enthalten; ausschließlich kontrollierte Fehlercodes ausgeben.
  console.error(JSON.stringify({ status: "FAILED", code: error instanceof AuditTransferError ? error.code : "LOCAL_TRANSFER_FAILED", documentId: error instanceof AuditTransferError ? error.documentId : undefined, resume: "Last committed checkpoint retained; inspect safely and retry" }));
  process.exitCode = 1;
} finally { await db?.$disconnect(); await mongo?.close(); await postgres?.end(); }
