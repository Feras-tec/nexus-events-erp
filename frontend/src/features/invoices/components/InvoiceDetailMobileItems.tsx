import { useTranslation } from "react-i18next";
import type { InvoiceItem } from "../types/invoice.types";

type InvoiceDetailMobileItemsProps = {
  items: InvoiceItem[];
};

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function InvoiceDetailMobileItems({
  items,
}: InvoiceDetailMobileItemsProps) {
  const { t, i18n } = useTranslation();

  const language = i18n.resolvedLanguage ?? i18n.language;
  const locale = language.startsWith("ar")
    ? "de-DE"
    : language.startsWith("en")
      ? "en-GB"
      : "de-DE";

  return (
    <div className="space-y-3 lg:hidden">
      {items.map((item, index) => (
        <article
          key={item.id ?? `${item.description}-${index}`}
          className="card min-w-0 border border-base-300 bg-base-100"
        >
          <div className="card-body min-w-0 gap-4 p-4">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <h3 className="min-w-0 flex-1 break-words font-semibold">
                {item.description}
              </h3>

              <span className="badge badge-outline">
                {t(`invoices.itemTypes.${item.type}`, {
                  defaultValue: item.type,
                })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="min-w-0">
                <p className="text-base-content/60">
                  {t("invoices.detail.quantity")}
                </p>
                <p className="mt-1 font-medium tabular-nums">
                  {item.quantity}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-base-content/60">
                  {t("invoices.detail.unitPrice")}
                </p>
                <p dir="ltr" className="mt-1 w-fit font-medium">
                  {formatCurrency(item.unitPrice, locale)}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-base-content/60">
                  {t("invoices.detail.discount")}
                </p>
                <p className="mt-1 font-medium tabular-nums">
                  {item.discount} %
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-base-content/60">
                  {t("invoices.table.total")}
                </p>
                <p dir="ltr" className="mt-1 w-fit font-semibold">
                  {formatCurrency(item.total ?? 0, locale)}
                </p>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
