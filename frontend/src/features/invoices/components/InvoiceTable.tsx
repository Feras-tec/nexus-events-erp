import { useTranslation } from "react-i18next";
import { InvoiceMobileCards } from "./InvoiceMobileCards";

import type {
  Invoice,
} from "../types/invoice.types";

type InvoiceTableProps = {
  invoices: Invoice[];
  onView: (invoiceId: string) => void;
};

function getCustomerName(invoice: Invoice) {
  if (invoice.customer.companyName) {
    return invoice.customer.companyName;
  }

  return [
    invoice.customer.firstName,
    invoice.customer.lastName,
  ]
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

export function InvoiceTable({
  invoices,
  onView,
}: InvoiceTableProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const locale = language.startsWith("ar")
    ? "ar"
    : language.startsWith("en")
      ? "en-GB"
      : "de-DE";

  if (invoices.length === 0) {
    return (
      <div className="py-12 text-center text-base-content/60">
        {t("invoices.table.empty")}
      </div>
    );
  }

  return (
    <>
      <InvoiceMobileCards
        invoices={invoices}
        onView={onView}
      />

      <div className="hidden overflow-x-auto rounded-box border border-base-300 bg-base-100 md:block">
        <table className="table">
        <thead>
          <tr>
            <th>{t("invoices.table.invoiceNo")}</th>
            <th>{t("invoices.table.customer")}</th>
            <th>{t("invoices.table.event")}</th>
            <th>{t("invoices.table.status")}</th>
            <th>{t("invoices.table.issueDate")}</th>
            <th>{t("invoices.table.dueDate")}</th>
            <th className="text-right">{t("invoices.table.total")}</th>
            <th />
          </tr>
        </thead>

        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td className="font-medium">
                {invoice.invoiceNo}
              </td>

              <td>
                {getCustomerName(invoice) || "—"}
              </td>

              <td>
                {invoice.event
                  ? `${invoice.event.eventNo} · ${invoice.event.name}`
                  : "—"}
              </td>

              <td>
                <span className="badge badge-outline">
                  {t(`status.${invoice.status}`)}
                </span>
              </td>

              <td>{formatDate(invoice.issueDate, locale)}</td>

              <td>{formatDate(invoice.dueDate, locale)}</td>

              <td className="text-right font-medium">
                {formatCurrency(invoice.total, locale)}
              </td>

              <td className="text-right">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => onView(invoice.id)}
                >
                  {t("invoices.table.open")}
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
