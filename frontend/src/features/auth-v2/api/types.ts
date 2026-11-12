/**
 * Typed contracts for the Phase 2D auth-v2 backend.
 *
 * Sources of truth:
 *  - `backend/src/modules/auth-v2/router.ts` for custom routes
 *  - `backend/auth-v2-tests/*.test.ts` for better-auth endpoint shapes
 *
 * better-auth does not publish a versioned schema for the catch-all routes.
 * Those types are marked as "observed" and must be re-verified when
 * better-auth is upgraded.
 */

export const AUTH_V2_ROLES = [
  "OWNER",
  "ADMIN",
  "HR_MANAGER",
  "ACCOUNTANT",
  "SALES_MANAGER",
  "PROJECT_MANAGER",
  "DEPARTMENT_MANAGER",
  "WAREHOUSE_MANAGER",
  "TECHNICIAN",
  "WAREHOUSE_EMPLOYEE",
  "SALES_EMPLOYEE",
  "EMPLOYEE",
] as const;

export type AuthV2Role = (typeof AUTH_V2_ROLES)[number];

/** Roles an ADMIN may manage or assign (mirrors backend permissions.ts). */
export const AUTH_V2_ADMIN_MANAGEABLE_ROLES: readonly AuthV2Role[] =
  AUTH_V2_ROLES.filter((role) => role !== "OWNER" && role !== "ADMIN");

export type AuthV2User = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  twoFactorRequired: boolean;
  twoFactorEnforcedAt?: string | null;
};

export type AuthV2Session = {
  id: string;
  createdAt: string;
  expiresAt: string;
  reauthenticatedAt?: string | null;
};

export type AccountMeResponse = {
  user: AuthV2User;
  session: AuthV2Session;
};

/** Observed better-auth `GET /get-session` response. */
export type GetSessionResponse = {
  user: AuthV2User;
  session: AuthV2Session;
} | null;

/**
 * Observed sign-in response. The backend strips every `token` field, so the
 * only meaningful discriminator is `twoFactorRedirect`.
 */
export type SignInEmailResponse = {
  twoFactorRedirect?: boolean;
  user?: AuthV2User;
};

/** Observed `POST /two-factor/enable` response. */
export type TwoFactorEnableResponse = {
  method?: "totp";
  totpURI: string;
  backupCodes: string[];
};

/** Observed verification response; the cookie rotates, no token is returned. */
export type TwoFactorVerifyResponse = {
  status?: boolean;
};

export type MfaPolicyResponse = {
  required: boolean;
  enabled: boolean;
  enforcedAt: string | null;
  deadline: string | null;
  enrollmentOverdue: boolean;
};

export type SessionRecord = {
  id: string;
  userId: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt?: string;
  lastSeenAt: string | null;
};

export type ListSessionsResponse = {
  currentSessionId: string;
  sessions: SessionRecord[];
};

export type RevokeResponse = {
  revoked: number;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  twoFactorRequired: boolean;
  createdAt: string;
};

export type AdminUserListResponse = {
  users: AdminUser[];
};

export type AdminUserUpdateResponse = {
  user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  };
};

export type MfaRequirementResponse = {
  user: {
    id: string;
    email: string;
    twoFactorRequired: boolean;
    twoFactorEnforcedAt: string | null;
  };
};

export type Invitation = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type InvitationListResponse = {
  invitations: Invitation[];
};

export type CreateInvitationResponse = {
  invitation: Invitation;
  delivery: "email" | "outbox";
};

export type AcceptInvitationResponse = {
  status: true;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

export type TransferOwnershipResponse = {
  previousOwnerId: string;
  newOwnerId: string;
};

export type SecurityEvent = {
  id: string;
  eventType: string;
  actorId: string | null;
  targetId: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
};

export type SecurityEventListResponse = {
  events: SecurityEvent[];
};

export type StepUpResponse = {
  status: true;
};

export type PasswordResetRequestResponse = {
  status: boolean;
};

export type PasswordResetResponse = {
  status: boolean;
};

export type ChangePasswordResponse = {
  status?: boolean;
};

export type HealthResponse = {
  status: string;
  module: string;
};
