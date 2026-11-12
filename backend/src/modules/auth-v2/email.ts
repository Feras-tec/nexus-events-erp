/**
 * Transactional email boundary for auth-v2.
 *
 * In tests and local development the module writes to an in-memory outbox.
 * Real delivery is opt-in (`AUTH_V2_EMAIL_DELIVERY_ENABLED=true`) and requires
 * `RESEND_API_KEY` + `EMAIL_FROM`. No secret is ever logged.
 */
export type InvitationEmail = {
  invitationId: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
};

export type PasswordResetEmail = {
  userId: string;
  email: string;
  token: string;
  url: string;
  createdAt: Date;
};

export const authV2Outbox: {
  invitations: InvitationEmail[];
  passwordResets: PasswordResetEmail[];
} = {
  invitations: [],
  passwordResets: [],
};

export function clearAuthV2Outbox(): void {
  authV2Outbox.invitations.length = 0;
  authV2Outbox.passwordResets.length = 0;
}

async function sendViaResend(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EMAIL_FROM"];
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and EMAIL_FROM are required for delivery");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email delivery failed with status ${response.status}`);
  }
}

function deliveryEnabled(): boolean {
  return process.env["AUTH_V2_EMAIL_DELIVERY_ENABLED"] === "true";
}

export async function deliverInvitationEmail(
  invitation: InvitationEmail,
  activateUrl: string,
): Promise<void> {
  authV2Outbox.invitations.push(invitation);
  if (!deliveryEnabled()) return;

  await sendViaResend({
    to: invitation.email,
    subject: "Nexus Events ERP – Einladung",
    text: [
      "Sie wurden zu Nexus Events ERP eingeladen.",
      "",
      `Aktivierungslink: ${activateUrl}`,
      `Der Link läuft am ${invitation.expiresAt.toISOString()} ab.`,
      "",
      "Falls Sie diese Einladung nicht erwartet haben, ignorieren Sie diese E-Mail.",
    ].join("\n"),
  });
}

export async function deliverPasswordResetEmail(
  reset: PasswordResetEmail,
): Promise<void> {
  authV2Outbox.passwordResets.push(reset);
  if (!deliveryEnabled()) return;

  await sendViaResend({
    to: reset.email,
    subject: "Nexus Events ERP – Passwort zurücksetzen",
    text: [
      "Fordern Sie ein neues Passwort über den folgenden Link an:",
      "",
      reset.url,
      "",
      "Der Link ist eine Stunde gültig und kann nur einmal verwendet werden.",
      "Falls Sie dies nicht angefordert haben, ignorieren Sie diese E-Mail.",
    ].join("\n"),
  });
}

// Echte Zustellung ist für die Ersteinrichtung zwingend; kein Test-Outbox-Ersatz im produktiven Pfad.
export async function deliverFirstPasswordEmail(input: { email: string; url: string }): Promise<void> {
  if (!deliveryEnabled()) throw new Error("Real email delivery required for first-password setup");
  await sendViaResend({ to: input.email, subject: "Nexus Events ERP – Passwort einrichten", text: `Bestätigen Sie Ihre E-Mail-Adresse und richten Sie Ihr neues Passwort ein: ${input.url}\nDer Link ist 15 Minuten gültig und kann nur einmal verwendet werden.` });
}
