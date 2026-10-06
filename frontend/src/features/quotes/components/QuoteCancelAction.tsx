import { useState } from "react";

import { useQuoteStatusAction } from "../hooks/useQuoteStatusAction";

type QuoteCancelActionProps = {
  quoteId: string;
  quoteNo: string;
  disabled?: boolean;
};

export function QuoteCancelAction({
  quoteId,
  quoteNo,
  disabled = false,
}: QuoteCancelActionProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    changeQuoteStatus,
    isChangingStatus,
    statusError,
  } = useQuoteStatusAction();

  async function handleCancel() {
    try {
      await changeQuoteStatus({
        quoteId,
        status: "CANCELLED",
      });

      setShowConfirm(false);
    } catch {
      // Fehler wird über statusError angezeigt.
    }
  }

  if (showConfirm) {
    return (
      <div className="rounded-box border border-error/30 bg-error/5 p-4">
        <p className="font-semibold">
          Angebot {quoteNo} wirklich stornieren?
        </p>

        <p className="mt-1 text-sm opacity-70">
          Das Angebot bleibt im System erhalten und wird als
          storniert markiert.
        </p>

        {statusError && (
          <div
            role="alert"
            className="alert alert-error mt-3"
          >
            {statusError}
          </div>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={isChangingStatus}
            onClick={() => setShowConfirm(false)}
          >
            Abbrechen
          </button>

          <button
            type="button"
            className="btn btn-error"
            disabled={isChangingStatus}
            onClick={handleCancel}
          >
            {isChangingStatus && (
              <span className="loading loading-spinner loading-sm" />
            )}

            Stornierung bestätigen
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-outline btn-error"
      disabled={disabled || isChangingStatus}
      onClick={() => setShowConfirm(true)}
    >
      Stornieren
    </button>
  );
}
