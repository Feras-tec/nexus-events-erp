import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ConfirmDeleteDialog } from "../../../components/molecules/ConfirmDeleteDialog";
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
  const { t } = useTranslation();
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
      // Error is displayed inside the dialog.
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-outline btn-error btn-sm"
        disabled={disabled || isChangingStatus}
        onClick={() => setShowConfirm(true)}
      >
        {t("quotes.actions.cancelQuote")}
      </button>

      <ConfirmDeleteDialog
        open={showConfirm}
        title={
          <span className="flex flex-col gap-1">
            <span>
              {t("quotes.actions.cancelQuestion", {
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
        message={t("quotes.actions.cancelDescription")}
        confirmLabel={t("quotes.actions.confirmCancel")}
        cancelLabel={t("quotes.actions.cancelButton")}
        confirmVariant="error"
        loading={isChangingStatus}
        error={statusError}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleCancel}
      />
    </>
  );
}
