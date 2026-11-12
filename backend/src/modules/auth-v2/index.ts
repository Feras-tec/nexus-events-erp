// Öffentliche Auth-V2-Schnittstelle; die zentrale Modusauswahl steuert die Initialisierung.
export { createAuthV2, type AuthV2Auth } from "./auth.js";
export {
  AUTH_V2_BASE_PATH,
  ARGON2_OPTIONS,
  assertAuthV2Enabled,
  readAuthV2Config,
  type AuthV2RuntimeConfig,
} from "./config.js";
export { createAuthV2Router, type AuthV2RouterOptions } from "./router.js";
export { authV2Prisma } from "./prisma.js";
export {
  clearAuthV2Outbox,
  authV2Outbox,
  type InvitationEmail,
  type PasswordResetEmail,
} from "./email.js";
export {
  ALL_ROLES,
  ADMIN_MANAGEABLE_ROLES,
  PolicyError,
  type Role,
} from "./permissions.js";
export { hashInvitationToken, hashSessionToken } from "./token-hash.js";
