import { defineConfig } from "prisma/config";

/**
 * Isolated Prisma configuration for the auth-v2 module.
 *
 * It intentionally refuses to fall back to DATABASE_URL/DIRECT_URL so a local
 * migration or test command can never target the production database by
 * accident. The auth-v2 module is disabled in the running application.
 */
const url = process.env["AUTH_V2_DATABASE_URL"];
if (!url) {
  throw new Error(
    "AUTH_V2_DATABASE_URL is required for auth-v2 schema/migration work",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: { url },
});
