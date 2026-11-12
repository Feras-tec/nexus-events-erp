export const authV2QueryKeys = {
  root: ["auth-v2"] as const,
  me: () => [...authV2QueryKeys.root, "me"] as const,
  mfaPolicy: () => [...authV2QueryKeys.root, "mfa-policy"] as const,
  sessions: () => [...authV2QueryKeys.root, "sessions"] as const,
  adminUsers: () => [...authV2QueryKeys.root, "admin-users"] as const,
  invitations: () => [...authV2QueryKeys.root, "invitations"] as const,
  securityEvents: () => [...authV2QueryKeys.root, "security-events"] as const,
};
