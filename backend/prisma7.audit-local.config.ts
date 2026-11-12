import { defineConfig } from "prisma/config";
import { requireLocalAuditUrl } from "./src/modules/audit-postgres/local-safety.js";

// Kein dotenv-Import und kein Produktions-Fallback bei Schema- und Migrationstests.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: requireLocalAuditUrl(process.env.AUDIT_TEST_DATABASE_URL, "postgres") },
});
