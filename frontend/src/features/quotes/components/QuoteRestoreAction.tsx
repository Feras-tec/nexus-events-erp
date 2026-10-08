import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ConfirmDeleteDialog } from "../../../components/molecules/ConfirmDeleteDialog";
import { useRestoreQuote } from "../hooks/useRestoreQuote";

type QuoteRestoreActionProps = {
  quoteId: string;
  quoteNo: string;
};

export function QuoteRestoreAction({
  quoteId,
  quoteNo,
}: QuoteRestoreActionProps) {
  const { t } = useTranslation();
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
      // Error is displayed inside the dialog.
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-outline btn-warning btn-sm"
        disabled={isRestoring}
        onClick={() => setShowConfirm(true)}
      >
        {t("quotes.actions.restoreQuote")}
      </button>

      <ConfirmDeleteDialog
        open={showConfirm}
        title={
          <span className="flex flex-col gap-1">
            <span>
              {t("quotes.actions.restoreQuestion", {
                quoteNo: "",
              }).replace(/\\s+/g, " ").trim()}
            </span>
            <span
              dir="ltr"
              className="block w-fit max-w-full whitespace-nowrap font-bold"
            >
              {quoteNo}
            </span>
          </span>
        }
        message={t("quotes.actions.restoreDescription")}
        confirmLabel={t("quotes.actions.restoreQuote")}
        cancelLabel={t("quotes.actions.cancelButton")}
        confirmVariant="warning"
        loading={isRestoring}
        error={restoreError}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleRestore}
      />
    </>
  );
}
