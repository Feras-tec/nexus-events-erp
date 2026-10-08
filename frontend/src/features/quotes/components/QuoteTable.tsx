import { useTranslation } from "react-i18next";
import type { Quote } from "../types/quote.types";
import { QuoteMobileCards } from "./QuoteMobileCards";

type QuoteTableProps = {
  quotes: Quote[];
  onView: (quoteId: string) => void;
};

function getCustomerName(quote: Quote) {
  if (quote.customer.companyName) {
    return quote.customer.companyName;
  }

  return [quote.customer.firstName, quote.customer.lastName]
    .filter(Boolean)
    .join(" ");
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat(locale).format(
    new Date(value),
  );
}

export function QuoteTable({
  quotes,
  onView,
}: QuoteTableProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage?.startsWith("ar")
    ? "ar"
    : i18n.resolvedLanguage?.startsWith("en")
      ? "en-GB"
      : "de-DE";

  if (quotes.length === 0) {
    return (
      <div className="py-12 text-center text-base-content/60">
        {t("quotes.table.empty")}
      </div>
    );
  }

  return (
    <>
      <QuoteMobileCards quotes={quotes} onView={onView} />

      <div className="hidden overflow-x-auto rounded-box border border-base-300 bg-base-100 md:block">
        <table className="table">
        <thead>
          <tr>
            <th>{t("quotes.table.quoteNo")}</th>
            <th>{t("quotes.table.customer")}</th>
            <th>{t("quotes.table.event")}</th>
            <th>{t("quotes.table.status")}</th>
            <th>{t("quotes.table.validUntil")}</th>
            <th className="text-right">{t("quotes.table.total")}</th>
            <th />
          </tr>
        </thead>

        <tbody>
          {quotes.map((quote) => (
            <tr key={quote.id}>
              <td className="font-medium">
                {quote.quoteNo}
              </td>

              <td>{getCustomerName(quote) || "—"}</td>

              <td>
                {quote.event
                  ? `${quote.event.eventNo} · ${quote.event.name}`
                  : "—"}
              </td>

              <td>
                <span className="badge badge-outline">
                  {t(`quotes.statuses.${quote.status}`)}
                </span>
              </td>

              <td>{formatDate(quote.validUntil, locale)}</td>

              <td className="text-right font-medium">
                {formatCurrency(quote.total, locale)}
              </td>

              <td className="text-right">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => onView(quote.id)}
                >
                  {t("quotes.table.open")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </>
  );
}
