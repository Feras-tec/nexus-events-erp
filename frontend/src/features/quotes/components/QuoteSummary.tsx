import type { QuoteFormItem } from "../types/quote.types";
import {
  calculateQuoteTotals,
  formatQuoteCurrency,
} from "../utils/quote-calculations";

type QuoteSummaryProps = {
  items: QuoteFormItem[];
  discount: string;
  tax: string;
};

export function QuoteSummary({
  items,
  discount,
  tax,
}: QuoteSummaryProps) {
  const totals = calculateQuoteTotals(
    items,
    discount,
    tax,
  );

  return (
    <div className="flex justify-end">
      <div className="w-full max-w-md rounded-box border border-base-300 bg-base-100 p-5">
        <h2 className="mb-4 text-lg font-semibold">
          Zusammenfassung
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between gap-4">
            <span className="text-base-content/70">
              Zwischensumme
            </span>
            <span>
              {formatQuoteCurrency(totals.subtotal)}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-base-content/70">
              Rabatt ({Number(discount) || 0} %)
            </span>
            <span>
              − {formatQuoteCurrency(totals.discountAmount)}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-base-content/70">
              Netto
            </span>
            <span>
              {formatQuoteCurrency(totals.net)}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-base-content/70">
              MwSt. ({Number(tax) || 0} %)
            </span>
            <span>
              {formatQuoteCurrency(totals.taxAmount)}
            </span>
          </div>

          <div className="divider my-1" />

          <div className="flex justify-between gap-4 text-lg font-bold">
            <span>Gesamt</span>
            <span>
              {formatQuoteCurrency(totals.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
