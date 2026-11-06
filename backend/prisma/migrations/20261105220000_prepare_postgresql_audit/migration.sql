-- Die additive Migration wird bei Fehlern vollständig zurückgerollt; Sperrzeiten bleiben begrenzt.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
-- Nur neue Tabellen und Indizes; bestehende ERP- und Auth-V2-Daten bleiben unverändert.
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT,
    "originalDocumentId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedAt" TIMESTAMPTZ(3),
    "sourceHash" TEXT,
    "originalDocument" JSONB,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditLog_source_pair_check" CHECK (("sourceKey" IS NULL) = ("originalDocumentId" IS NULL))
);
CREATE UNIQUE INDEX "AuditLog_sourceKey_originalDocumentId_key" ON "AuditLog"("sourceKey", "originalDocumentId");
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");
CREATE TABLE "AuditLogTransfer" (
    "sourceKey" TEXT NOT NULL,
    "snapshotUpperId" TEXT,
    "expectedCount" INTEGER NOT NULL,
    "lastId" TEXT,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COPYING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "AuditLogTransfer_pkey" PRIMARY KEY ("sourceKey")
);
COMMIT;
