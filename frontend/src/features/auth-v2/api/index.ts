import { authV2Request } from "./client";
import type {
  AcceptInvitationResponse,
  AccountMeResponse,
  AdminUserListResponse,
  AdminUserUpdateResponse,
  ChangePasswordResponse,
  CreateInvitationResponse,
  GetSessionResponse,
  HealthResponse,
  Invitation,
  InvitationListResponse,
  ListSessionsResponse,
  MfaPolicyResponse,
  MfaRequirementResponse,
  PasswordResetRequestResponse,
  PasswordResetResponse,
  RevokeResponse,
  SecurityEventListResponse,
  SignInEmailResponse,
  StepUpResponse,
  TransferOwnershipResponse,
  TwoFactorEnableResponse,
  TwoFactorVerifyResponse,
} from "./types";

function encode(value: string): string {
  return encodeURIComponent(value);
}

export const authV2Api = {
  // ---------------------------------------------------------------
  // Credential endpoints (public)
  // ---------------------------------------------------------------
  signInEmail(input: { email: string; password: string }) {
    return authV2Request<SignInEmailResponse>("/sign-in/email", {
      method: "POST",
      body: input,
      publicCredentialEndpoint: true,
    });
  },

  requestPasswordReset(input: { email: string; redirectTo?: string }) {
    return authV2Request<PasswordResetRequestResponse>(
      "/request-password-reset",
      {
        method: "POST",
        body: input,
        publicCredentialEndpoint: true,
      },
    );
  },

  completeFirstPassword(input: { token: string; newPassword: string }) {
    return authV2Request<PasswordResetResponse>("/first-password/complete", {
      method: "POST", body: input, publicCredentialEndpoint: true,
    });
  },

  resetPassword(input: { token: string; newPassword: string }) {
    return authV2Request<PasswordResetResponse>("/reset-password", {
      method: "POST",
      body: input,
      publicCredentialEndpoint: true,
    });
  },

  acceptInvitation(input: { token: string; name?: string; password: string }) {
    return authV2Request<AcceptInvitationResponse>("/invitations/accept", {
      method: "POST",
      body: input,
      publicCredentialEndpoint: true,
    });
  },

  verifyTotp(input: { code: string }) {
    return authV2Request<TwoFactorVerifyResponse>("/two-factor/verify-totp", {
      method: "POST",
      body: input,
      publicCredentialEndpoint: true,
    });
  },

  verifyBackupCode(input: { code: string }) {
    return authV2Request<TwoFactorVerifyResponse>(
      "/two-factor/verify-backup-code",
      {
        method: "POST",
        body: input,
        publicCredentialEndpoint: true,
      },
    );
  },

  // ---------------------------------------------------------------
  // Session lifecycle (better-auth catch-all, observed shapes)
  // ---------------------------------------------------------------
  getSession() {
    return authV2Request<GetSessionResponse>("/get-session", {
      suppressSessionExpiry: true,
    });
  },

  signOut() {
    return authV2Request<{ status?: boolean }>("/sign-out", {
      method: "POST",
      body: {},
    });
  },

  // ---------------------------------------------------------------
  // Authenticated account endpoints
  // ---------------------------------------------------------------
  accountMe() {
    return authV2Request<AccountMeResponse>("/account/me", {
      suppressSessionExpiry: true,
    });
  },

  stepUp(input: { password: string }) {
    return authV2Request<StepUpResponse>("/account/step-up", {
      method: "POST",
      body: input,
    });
  },

  changePassword(input: {
    currentPassword: string;
    newPassword: string;
    revokeOtherSessions?: boolean;
  }) {
    return authV2Request<ChangePasswordResponse>("/change-password", {
      method: "POST",
      body: input,
    });
  },

  enableTwoFactor(input: { password: string }) {
    return authV2Request<TwoFactorEnableResponse>("/two-factor/enable", {
      method: "POST",
      body: input,
    });
  },

  disableTwoFactor(input: { password: string }) {
    return authV2Request<{ status?: boolean }>("/two-factor/disable", {
      method: "POST",
      body: input,
    });
  },

  getMfaPolicy() {
    return authV2Request<MfaPolicyResponse>("/mfa/policy");
  },

  listSessions() {
    return authV2Request<ListSessionsResponse>("/sessions");
  },

  revokeSession(sessionId: string) {
    return authV2Request<RevokeResponse>(
      `/sessions/${encode(sessionId)}/revoke`,
      { method: "POST" },
    );
  },

  revokeOtherSessions() {
    return authV2Request<RevokeResponse>("/sessions/revoke-others", {
      method: "POST",
    });
  },

  // ---------------------------------------------------------------
  // Administration (OWNER / ADMIN; sensitive routes also need step-up)
  // ---------------------------------------------------------------
  listAdminUsers() {
    return authV2Request<AdminUserListResponse>("/admin/users");
  },

  updateAdminUser(
    userId: string,
    changes: { role?: string; isActive?: boolean },
  ) {
    return authV2Request<AdminUserUpdateResponse>(
      `/admin/users/${encode(userId)}`,
      { method: "PATCH", body: changes },
    );
  },

  updateUserMfaRequirement(userId: string, required: boolean) {
    return authV2Request<MfaRequirementResponse>(
      `/admin/users/${encode(userId)}/mfa`,
      { method: "PATCH", body: { required } },
    );
  },

  revokeUserSessions(userId: string) {
    return authV2Request<RevokeResponse>(
      `/admin/users/${encode(userId)}/revoke-sessions`,
      { method: "POST" },
    );
  },

  transferOwnership(targetId: string) {
    return authV2Request<TransferOwnershipResponse>("/admin/owner/transfer", {
      method: "POST",
      body: { targetId },
    });
  },

  listInvitations() {
    return authV2Request<InvitationListResponse>("/invitations");
  },

  createInvitation(input: { email: string; role: string }) {
    return authV2Request<CreateInvitationResponse>("/invitations", {
      method: "POST",
      body: input,
    });
  },

  revokeInvitation(invitationId: string) {
    return authV2Request<{ invitation: Invitation }>(
      `/invitations/${encode(invitationId)}/revoke`,
      { method: "POST" },
    );
  },

  listSecurityEvents() {
    // The backend caps the response at 100 events; no client-side limit is sent.
    return authV2Request<SecurityEventListResponse>("/security-events");
  },

  // ---------------------------------------------------------------
  // Diagnostics (isolated route, safe to use for readiness checks)
  // ---------------------------------------------------------------
  health() {
    return authV2Request<HealthResponse>("/health");
  },
};
