import { useTranslation } from "react-i18next";
import { useInvoicePrint } from "../hooks/useInvoicePrint";
import "./invoice-print.css";

export function InvoicePrintAction() {
  const { printInvoice } = useInvoicePrint();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="btn btn-outline w-36"
      onClick={printInvoice}
    >
      {t("invoices.detail.print")}
    </button>
  );
}
