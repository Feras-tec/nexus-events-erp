import { createHash } from "node:crypto";

export const EXPECTED_TRANSFER_TARGET = {
  projectId: "summer-rice-79851844", branchId: "br-fragrant-snow-b1vzgho0", database: "neondb",
  host: "ep-rapid-king-b1cddtof.c-5.eu-central-1.aws.neon.tech",
  ownerId: "a2abb31a-b61b-4dfa-aac3-385c439998ec",
  sourceHostHash: "77f883a30a86fc3db0e19fd64838c7f6deffedb942c6444c258d259a2f3581b1",
  sourceDatabase: "nexus_events_erp", sourceCollection: "auditlogs",
} as const;
export type TransferApproval = {
  operation: "T1"; approvalReference: string; expiresAt: string;
  productionBranchName: "main"; preservationBranchName: "backup-before-authv2-audit-20261105";
  providerMappingVerified: true; recoveryVerified: true; maintenanceConfirmed: true;
  expectedCount: number; upperId: string | null;
};
export class TransferGuardError extends Error {
  constructor(public readonly code: string) { super(`Transfer guard rejected: ${code}`); }
}
export function validateTransferApproval(raw: string, digest: string | undefined, execute: string | undefined): TransferApproval {
  if (execute !== "T1_APPROVED" || !digest || createHash("sha256").update(raw).digest("hex") !== digest) throw new TransferGuardError("EXPLICIT_APPROVAL_REQUIRED");
  const a = JSON.parse(raw) as TransferApproval;
  if (a.operation !== "T1" || typeof a.approvalReference !== "string" || !a.approvalReference.trim() ||
      !Number.isFinite(Date.parse(a.expiresAt)) || Date.parse(a.expiresAt) <= Date.now() || Date.parse(a.expiresAt) > Date.now() + 60 * 60_000 ||
      a.productionBranchName !== "main" || a.preservationBranchName !== "backup-before-authv2-audit-20261105" ||
      a.providerMappingVerified !== true || a.recoveryVerified !== true || a.maintenanceConfirmed !== true ||
      !Number.isInteger(a.expectedCount) || a.expectedCount < 0 || (a.expectedCount === 0 ? a.upperId !== null : typeof a.upperId !== "string" || !/^[a-f0-9]{24}$/.test(a.upperId))) throw new TransferGuardError("INVALID_APPROVAL_MANIFEST");
  return a;
}
export function validateTransferUrls(target: string | undefined, source: string | undefined) {
  if (!target || !source) throw new TransferGuardError("EXPLICIT_URLS_REQUIRED");
  const pg = new URL(target), mongo = new URL(source);
  if (pg.protocol !== "postgresql:" || pg.hostname !== EXPECTED_TRANSFER_TARGET.host || pg.pathname !== "/neondb" || (pg.port && pg.port !== "5432") || pg.search || pg.hash || !pg.username || !pg.password) throw new TransferGuardError("TARGET_URL_REJECTED");
  if (mongo.protocol !== "mongodb+srv:" || createHash("sha256").update(mongo.hostname).digest("hex") !== EXPECTED_TRANSFER_TARGET.sourceHostHash ||
      mongo.pathname !== `/${EXPECTED_TRANSFER_TARGET.sourceDatabase}` || mongo.hash || !mongo.username || !mongo.password) throw new TransferGuardError("SOURCE_URL_REJECTED");
  // Unbekannte URI-Optionen ablehnen statt TLS-/Zielumgehungen zuzulassen.
  for (const [key] of mongo.searchParams) if (!["retryWrites", "w", "appName", "authSource"].includes(key)) throw new TransferGuardError("SOURCE_OPTIONS_REJECTED");
  return { target, source };
}
export function requireReadOnlyMongoPrivileges(info: unknown) {
  const auth = (info as { authInfo?: { authenticatedUsers?: unknown[]; authenticatedUserPrivileges?: { actions: string[] }[] } })?.authInfo;
  const allowed = new Set(["find", "listCollections", "listIndexes", "collStats", "dbStats", "listDatabases", "killCursors", "changeStream"]);
  if (!auth?.authenticatedUsers?.length || !auth.authenticatedUserPrivileges?.length || auth.authenticatedUserPrivileges.some(p => !p.actions.length || p.actions.some(a => !allowed.has(a)))) throw new TransferGuardError("READ_ONLY_SOURCE_PRINCIPAL_REQUIRED");
}
