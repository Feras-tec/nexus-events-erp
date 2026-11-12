const { Pool } = require("pg");
const fs = require("fs");
const password = fs.readFileSync("/tmp/opencode/nexus-m1/approval-a-pg-password", "utf8").trim();
const url = `postgresql://nexus_audit_transfer:${encodeURIComponent(password)}@ep-rapid-king-b1cddtof.c-5.eu-central-1.aws.neon.tech/neondb`;
const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 15000 });

async function main() {
  const client = await pool.connect();
  try {
    await client.query("SHOW default_transaction_read_only");
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const id = await client.query("SELECT current_database() AS db, current_setting('neon.project_id', true) AS project, current_setting('neon.branch_id', true) AS branch");
    const flags = await client.query("SELECT rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls, rolcanlogin FROM pg_roles WHERE rolname = current_user");
    const audit = await client.query("SELECT count(*)::int AS audit_rows FROM \"AuditLog\"");
    const checkpoint = await client.query("SELECT count(*)::int AS checkpoint_rows FROM \"AuditLogTransfer\"");
    const mig = await client.query("SELECT count(*)::int AS applied, count(*)::int AS failed FROM \"_prisma_migrations\" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL");
    const owner = await client.query("SELECT id, role, \"isActive\", (\"clerkUserId\" IS NOT NULL) AS linked FROM \"AppUser\" WHERE id = $1 AND email = $2", ["a2abb31a-b61b-4dfa-aac3-385c439998ec", "fr0000911@gmail.com"]);
    await client.query("ROLLBACK");
    console.log("PG READ-ONLY VERIFIED");
    console.log("db/project/branch:", { db: id.rows[0].db, project: id.rows[0].project, branch: id.rows[0].branch });
    console.log("flags:", { rolsuper: flags.rows[0].rolsuper, rolcreatedb: flags.rows[0].rolcreatedb, rolcreaterole: flags.rows[0].rolcreaterole, rolreplication: flags.rows[0].rolreplication, rolbypassrls: flags.rows[0].rolbypassrls, rolcanlogin: flags.rows[0].rolcanlogin });
    console.log("audit_rows:", audit.rows[0].audit_rows);
    console.log("checkpoint_rows:", checkpoint.rows[0].checkpoint_rows);
    console.log("migrations:", { applied: mig.rows[0].applied, failed: mig.rows[0].failed });
    console.log("owner:", { id: owner.rows[0].id, role: owner.rows[0].role, isActive: owner.rows[0].isActive, linked: owner.rows[0].linked });
  } finally {
    await client.query("ROLLBACK");
    await pool.end();
  }
}

main();