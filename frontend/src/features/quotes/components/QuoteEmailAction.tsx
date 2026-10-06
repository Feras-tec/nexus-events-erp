import { useSendQuoteEmail } from "../hooks/useSendQuoteEmail";

type QuoteEmailActionProps = {
  quoteId: string;
  customerEmail?: string | null;
  disabled?: boolean;
};

export function QuoteEmailAction({
  quoteId,
  customerEmail,
  disabled = false,
}: QuoteEmailActionProps) {
  const {
    sendQuoteEmail,
    isSending,
    sendError,
    sentEmail,
    resetSendEmail,
  } = useSendQuoteEmail();

  const handleSend = async () => {
    resetSendEmail();

    try {
      await sendQuoteEmail(quoteId);
    } catch {
      // Fehlermeldung wird über sendError angezeigt.
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={disabled || isSending || !customerEmail}
        title={
          customerEmail
            ? `An ${customerEmail} senden`
            : "Kunde hat keine E-Mail-Adresse"
        }
        onClick={handleSend}
      >
        {isSending ? (
          <>
            <span className="loading loading-spinner loading-xs" />
            Wird gesendet...
          </>
        ) : (
          "E-Mail senden"
        )}
      </button>

      {sentEmail && (
        <span className="text-xs text-success">
          Gesendet an {sentEmail.recipient}
        </span>
      )}

      {sendError && (
        <span className="max-w-72 text-right text-xs text-error">
          {sendError}
        </span>
      )}
    </div>
  );
}
