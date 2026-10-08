import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();

  const totals = calculateQuoteTotals(
    items,
    discount,
    tax,
  );

  return (
    <div className="flex justify-end">
      <div className="w-full max-w-md rounded-box border border-base-300 bg-base-100 p-5">
        <h2 className="mb-4 text-lg font-semibold">
          {t("quotes.summary.title")}
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between gap-4">
            <span className="text-base-content/70">
              {t("quotes.summary.subtotal")}
            </span>
            <span>
              {formatQuoteCurrency(totals.subtotal, i18n.language)}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-base-content/70">
              {t("quotes.summary.discount")} ({Number(discount) || 0} %)
            </span>
            <span>
              − {formatQuoteCurrency(totals.discountAmount, i18n.language)}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-base-content/70">
              {t("quotes.summary.net")}
            </span>
            <span>
              {formatQuoteCurrency(totals.net, i18n.language)}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-base-content/70">
              {t("quotes.summary.tax")} ({Number(tax) || 0} %)
            </span>
            <span>
              {formatQuoteCurrency(totals.taxAmount, i18n.language)}
            </span>
          </div>

          <div className="divider my-1" />

          <div className="flex justify-between gap-4 text-lg font-bold">
            <span>{t("quotes.summary.total")}</span>
            <span>
              {formatQuoteCurrency(totals.total, i18n.language)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
