import { useInvoicePrint } from "../hooks/useInvoicePrint";
import "./invoice-print.css";

export function InvoicePrintAction() {
  const { printInvoice } = useInvoicePrint();

  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={printInvoice}
    >
      Drucken / PDF
    </button>
  );
}
