import { useQuotePrint } from "../hooks/useQuotePrint";
import "./quote-print.css";

export function QuotePrintAction() {
  const { printQuote } = useQuotePrint();

  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={printQuote}
    >
      Drucken / PDF
    </button>
  );
}
