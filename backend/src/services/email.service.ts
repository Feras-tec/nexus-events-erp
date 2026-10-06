import { Resend } from "resend";

type EmailAttachment = {
  filename: string;
  content: Buffer;
};

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
};

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!from) {
    throw new Error("EMAIL_FROM is not configured");
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    ...(attachments && attachments.length > 0
      ? { attachments }
      : {}),
  });

  if (error) {
    throw new Error(`E-Mail konnte nicht gesendet werden: ${error.message}`);
  }

  return data;
}
