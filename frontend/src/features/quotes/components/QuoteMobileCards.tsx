import { CalendarDays, Eye, UserRound, CalendarCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Quote } from "../types/quote.types";

type QuoteMobileCardsProps = {
  quotes: Quote[];
  onView: (quoteId: string) => void;
};

function getCustomerName(quote: Quote) {
  return (
    quote.customer.companyName ||
    [quote.customer.firstName, quote.customer.lastName]
      .filter(Boolean)
      .join(" ") ||
    quote.customer.customerNo
  );
}

export function QuoteMobileCards({
  quotes,
  onView,
}: QuoteMobileCardsProps) {
  const { t, i18n } = useTranslation();

  const locale = i18n.resolvedLanguage?.startsWith("ar")
    ? "ar"
    : i18n.resolvedLanguage?.startsWith("en")
      ? "en-GB"
      : "de-DE";

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(value);

  const formatDate = (value?: string | null) => {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat(locale).format(date);
  };

  return (
    <div className="space-y-3 md:hidden">
      {quotes.map((quote) => (
        <article
          key={quote.id}
          className="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-all font-semibold">
                {quote.quoteNo}
              </p>
            </div>

            <span className="badge badge-outline shrink-0">
              {t(`quotes.statuses.${quote.status}`)}
            </span>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <UserRound size={17} className="mt-0.5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs text-base-content/60">
                  {t("quotes.table.customer")}
                </p>
                <p className="break-words font-medium">
                  {getCustomerName(quote)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarCheck size={17} className="mt-0.5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs text-base-content/60">
                  {t("quotes.table.event")}
                </p>
                <p className="break-words">
                  {quote.event
                    ? `${quote.event.eventNo} · ${quote.event.name}`
                    : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays size={17} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="text-xs text-base-content/60">
                  {t("quotes.table.validUntil")}
                </p>
                <p>{formatDate(quote.validUntil)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-base-300 pt-4">
            <span className="text-sm text-base-content/60">
              {t("quotes.table.total")}
            </span>

            <span className="text-lg font-bold tabular-nums" dir="ltr">
              {formatCurrency(quote.total)}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm mt-4 w-full gap-2"
            onClick={() => onView(quote.id)}
          >
            <Eye size={16} />
            {t("quotes.table.open")}
          </button>
        </article>
      ))}
    </div>
  );
}
