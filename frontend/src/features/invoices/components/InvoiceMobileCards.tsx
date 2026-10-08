import {
  CalendarDays,
  CalendarClock,
  CalendarCheck,
  Eye,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Invoice } from "../types/invoice.types";

type InvoiceMobileCardsProps = {
  invoices: Invoice[];
  onView: (invoiceId: string) => void;
};

function getCustomerName(invoice: Invoice) {
  return (
    invoice.customer.companyName ||
    [invoice.customer.firstName, invoice.customer.lastName]
      .filter(Boolean)
      .join(" ") ||
    invoice.customer.customerNo
  );
}

export function InvoiceMobileCards({
  invoices,
  onView,
}: InvoiceMobileCardsProps) {
  const { t, i18n } = useTranslation();

  const language = i18n.resolvedLanguage ?? i18n.language;

  const locale = language.startsWith("ar")
    ? "ar"
    : language.startsWith("en")
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

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-3 md:hidden">
      {invoices.map((invoice) => (
        <article
          key={invoice.id}
          className="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="min-w-0 break-all font-semibold" dir="ltr">
              {invoice.invoiceNo}
            </p>

            <span className="badge badge-outline">
              {t(`status.${invoice.status}`)}
            </span>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <UserRound
                size={17}
                className="mt-0.5 shrink-0 text-primary"
              />

              <div className="min-w-0">
                <p className="text-xs text-base-content/60">
                  {t("invoices.table.customer")}
                </p>

                <p className="break-words font-medium">
                  {getCustomerName(invoice)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarCheck
                size={17}
                className="mt-0.5 shrink-0 text-primary"
              />

              <div className="min-w-0">
                <p className="text-xs text-base-content/60">
                  {t("invoices.table.event")}
                </p>

                <p className="break-words">
                  {invoice.event
                    ? `${invoice.event.eventNo} · ${invoice.event.name}`
                    : "—"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <CalendarDays
                  size={17}
                  className="mt-0.5 shrink-0 text-primary"
                />

                <div>
                  <p className="text-xs text-base-content/60">
                    {t("invoices.table.issueDate")}
                  </p>

                  <p>
                    <span dir="ltr" className="inline-block">
                      {formatDate(invoice.issueDate)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarClock
                  size={17}
                  className="mt-0.5 shrink-0 text-primary"
                />

                <div>
                  <p className="text-xs text-base-content/60">
                    {t("invoices.table.dueDate")}
                  </p>

                  <p>
                    <span dir="ltr" className="inline-block">
                      {formatDate(invoice.dueDate)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-base-300 pt-4">
            <span className="text-sm text-base-content/60">
              {t("invoices.table.total")}
            </span>

            <span
              className="max-w-full break-words text-lg font-bold tabular-nums"
              dir="ltr"
            >
              {formatCurrency(invoice.total)}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm mt-4 w-full gap-2"
            onClick={() => onView(invoice.id)}
          >
            <Eye size={16} />
            {t("invoices.table.open")}
          </button>
        </article>
      ))}
    </div>
  );
}
