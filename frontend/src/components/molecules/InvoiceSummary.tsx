import { useTranslation } from "react-i18next";

type InvoiceSummaryProps = {
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
};

function formatCurrency(
  value: number | string,
  locale: string,
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
}

export function InvoiceSummary({
  subtotal,
  discount,
  tax,
  total,
}: InvoiceSummaryProps) {
  const { t, i18n } = useTranslation();

  const language = i18n.resolvedLanguage ?? i18n.language;

  const locale = language.startsWith("ar")
    ? "ar"
    : language.startsWith("en")
      ? "en-GB"
      : "de-DE";

  return (
    <section className="card border border-base-300 bg-base-100">
      <div className="card-body ml-auto w-full max-w-md space-y-2">
        <div className="flex justify-between gap-4">
          <span>{t("invoices.detail.subtotal")}</span>
          <span>{formatCurrency(subtotal, locale)}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span>{t("invoices.detail.discount")}</span>
          <span>{discount} %</span>
        </div>

        <div className="flex justify-between gap-4">
          <span>{t("invoices.detail.tax")}</span>
          <span>{tax} %</span>
        </div>

        <div className="divider my-1" />

        <div className="flex justify-between gap-4 text-lg font-bold">
          <span>{t("invoices.table.total")}</span>
          <span>{formatCurrency(total, locale)}</span>
        </div>
      </div>
    </section>
  );
}
