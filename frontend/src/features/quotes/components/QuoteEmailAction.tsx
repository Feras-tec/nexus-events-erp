import { useTranslation } from "react-i18next";
import { useSendQuoteEmail } from "../hooks/useSendQuoteEmail";

type QuoteEmailActionProps = {
  quoteId: string;
  customerEmail?: string | null;
  lastSentAt?: string | null;
  lastSentTo?: string | null;
  disabled?: boolean;
};

export function QuoteEmailAction({
  quoteId,
  customerEmail,
  lastSentAt,
  lastSentTo,
  disabled = false,
}: QuoteEmailActionProps) {
  const { t, i18n } = useTranslation();

  const {
    sendQuoteEmail,
    isSending,
    sendError,
    sentEmail,
    resetSendEmail,
  } = useSendQuoteEmail();

  const wasSent = Boolean(sentEmail || lastSentAt);

  const sentTo = sentEmail?.recipient ?? lastSentTo;

  const sentAt = sentEmail?.sentAt ?? lastSentAt;

  const formattedSentAt = sentAt
    ? new Intl.DateTimeFormat(
      i18n.language.startsWith("ar")
        ? "ar"
        : i18n.language.startsWith("en")
          ? "en-GB"
          : "de-DE",
      {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(sentAt))
    : null;

  const handleSend = async () => {
    resetSendEmail();

    try {
      await sendQuoteEmail(quoteId);
    } catch {
      // Fehlermeldung wird über sendError angezeigt.
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="btn btn-outline btn-sm w-40"
        disabled={disabled || isSending || !customerEmail}
        title={
          customerEmail
            ? t("quotes.actions.sendTo", { email: customerEmail })
            : t("quotes.actions.noCustomerEmail")
        }
        onClick={handleSend}
      >
        {isSending ? (
          <>
            <span className="loading loading-spinner loading-xs" />
            {t("quotes.actions.sending")}
          </>
        ) : wasSent ? (
          `✓ ${t("quotes.actions.resendEmail")}`
        ) : (
          t("quotes.actions.sendEmail")
        )}
      </button>

      {wasSent && sentTo && (
        <span className="absolute right-0 top-full mt-1 whitespace-nowrap text-xs text-success">
          {t("quotes.actions.sentTo", { email: sentTo })}
          {formattedSentAt ? ` · ${formattedSentAt}` : ""}
        </span>
      )}

      {sendError && (
        <span className="absolute right-0 top-full mt-1 w-72 text-right text-xs text-error">
          {sendError}
        </span>
      )}
    </div>
  );
}
