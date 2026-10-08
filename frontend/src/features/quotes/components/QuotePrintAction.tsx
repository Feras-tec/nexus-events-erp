import { useTranslation } from "react-i18next";
import { useQuotePrint } from "../hooks/useQuotePrint";
import "./quote-print.css";

export function QuotePrintAction() {
  const { t } = useTranslation();
  const { printQuote } = useQuotePrint();

  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={printQuote}
    >
      {t("quotes.actions.print")}
    </button>
  );
}
