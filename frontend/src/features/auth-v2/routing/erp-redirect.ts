// Ablauf- und MFA-Zustände haben Vorrang vor der allgemeinen Anmeldung.
export function erpAuthRedirect(status: string | null | undefined, reason: string | null | undefined, returnTo: string): string {
  if (status === 'expired') return `/auth-v2/session-expired?reason=${encodeURIComponent(reason ?? 'UNAUTHENTICATED')}`;
  if (status === 'mfa-enrollment-required') return '/auth-v2/mfa/enroll';
  return `/auth-v2/sign-in?returnTo=${encodeURIComponent(returnTo)}`;
}
