import { useTranslation } from "react-i18next";
import type { QuoteItem } from "../types/quote.types";
import { formatQuoteCurrency } from "../utils/quote-calculations";

type QuoteDetailMobileItemsProps = {
  items: QuoteItem[];
};

export function QuoteDetailMobileItems({
  items,
}: QuoteDetailMobileItemsProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="space-y-3 lg:hidden">
      {items.map((item) => (
        <article
          key={item.id}
          className="card min-w-0 border border-base-300 bg-base-100"
        >
          <div className="card-body min-w-0 gap-4 p-4">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <h3 className="min-w-0 flex-1 break-words font-semibold">
                {item.description}
              </h3>

              <span className="badge badge-outline">
                {t(`quotes.items.types.${item.type}`)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="min-w-0">
                <p className="text-base-content/60">
                  {t("quotes.detail.quantity")}
                </p>
                <p className="mt-1 font-medium tabular-nums">
                  {item.quantity}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-base-content/60">
                  {t("quotes.detail.unitPrice")}
                </p>
                <p className="mt-1 font-medium">
                  {formatQuoteCurrency(item.unitPrice, i18n.language)}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-base-content/60">
                  {t("quotes.detail.discount")}
                </p>
                <p className="mt-1 font-medium tabular-nums">
                  {item.discount} %
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-base-content/60">
                  {t("quotes.detail.total")}
                </p>
                <p className="mt-1 font-semibold">
                  {formatQuoteCurrency(item.total, i18n.language)}
                </p>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
