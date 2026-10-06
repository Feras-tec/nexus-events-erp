import { useState } from "react";

import { useRestoreQuote } from "../hooks/useRestoreQuote";

type QuoteRestoreActionProps = {
  quoteId: string;
  quoteNo: string;
};

export function QuoteRestoreAction({
  quoteId,
  quoteNo,
}: QuoteRestoreActionProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    restoreQuote,
    isRestoring,
    restoreError,
  } = useRestoreQuote();

  async function handleRestore() {
    try {
      await restoreQuote(quoteId);
      setShowConfirm(false);
    } catch {
      // Fehler wird über restoreError angezeigt.
    }
  }

  if (showConfirm) {
    return (
      <div className="rounded-box border border-warning/30 bg-warning/5 p-4">
        <p className="font-semibold">
          Stornierung von {quoteNo} aufheben?
        </p>

        <p className="mt-1 text-sm opacity-70">
          Das Angebot wird auf den Status vor der
          Stornierung zurückgesetzt.
        </p>

        {restoreError && (
          <div
            role="alert"
            className="alert alert-error mt-3"
          >
            {restoreError}
          </div>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={isRestoring}
            onClick={() => setShowConfirm(false)}
          >
            Abbrechen
          </button>

          <button
            type="button"
            className="btn btn-warning"
            disabled={isRestoring}
            onClick={handleRestore}
          >
            {isRestoring && (
              <span className="loading loading-spinner loading-sm" />
            )}

            Stornierung aufheben
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-outline btn-warning btn-sm"
      disabled={isRestoring}
      onClick={() => setShowConfirm(true)}
    >
      Stornierung aufheben
    </button>
  );
}
