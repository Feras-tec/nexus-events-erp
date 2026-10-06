import { useInvoicePrint } from "../hooks/useInvoicePrint";
import "./invoice-print.css";

export function InvoicePrintAction() {
  const { printInvoice } = useInvoicePrint();

  return (
    <button
      type="button"
      className="btn btn-outline w-36"
      onClick={printInvoice}
    >
      Drucken / PDF
    </button>
  );
}
