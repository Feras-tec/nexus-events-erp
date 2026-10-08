import { useTranslation } from "react-i18next";
import type { Invoice } from "../types/invoice.types";
import {
  formatInvoicePrintCurrency,
  formatInvoicePrintDate,
} from "../utils/invoice-print";
import { InvoicePrintItems } from "./InvoicePrintItems";

type InvoicePrintDocumentProps = {
  invoice: Invoice;
};

function getCustomerName(invoice: Invoice) {
  return (
    invoice.customer.companyName ||
    [invoice.customer.firstName, invoice.customer.lastName]
      .filter(Boolean)
      .join(" ") ||
    "—"
  );
}

export function InvoicePrintDocument({
  invoice,
}: InvoicePrintDocumentProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const isArabic = language.startsWith("ar");
  const locale = isArabic ? "ar" : language.startsWith("en") ? "en-GB" : "de-DE";

  return (
    <article className="invoice-print-sheet" dir={isArabic ? "rtl" : "ltr"}>
      <header className="invoice-print-header">
        <div>
          <p className="invoice-print-brand">NEXUS EVENTS</p>
          <p className="invoice-print-subtitle">
            {t("invoices.print.subtitle")}
          </p>
        </div>

        <div className="invoice-print-title">
          <h1>{t("invoices.print.title")}</h1>
          <strong>{invoice.invoiceNo}</strong>
        </div>
      </header>

      <section className="invoice-print-meta">
        <div>
          <span>{t("invoices.print.customer")}</span>
          <strong>{getCustomerName(invoice)}</strong>

          {invoice.customer.customerNo && (
            <small>{invoice.customer.customerNo}</small>
          )}

          {invoice.customer.email && (
            <small>{invoice.customer.email}</small>
          )}
        </div>

        <div>
          <span>{t("invoices.print.issueDate")}</span>
          <strong>
            {formatInvoicePrintDate(invoice.issueDate, locale)}
          </strong>

          <span>{t("invoices.print.dueDate")}</span>
          <strong>
            {formatInvoicePrintDate(invoice.dueDate, locale)}
          </strong>

          <span>{t("invoices.print.createdAt")}</span>
          <strong>
            <span dir="ltr">
              {new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23",
              }).format(new Date(invoice.createdAt))}
            </span>
          </strong>
        </div>
      </section>

      {(invoice.event || invoice.quote) && (
        <section className="invoice-print-reference">
          {invoice.event && (
            <div>
              <span>{t("invoices.print.event")}</span>
              <strong>
                {invoice.event.eventNo} · {invoice.event.name}
              </strong>
            </div>
          )}

          {invoice.quote && (
            <div>
              <span>{t("invoices.print.quote")}</span>
              <strong>{invoice.quote.quoteNo}</strong>
            </div>
          )}
        </section>
      )}

      <InvoicePrintItems items={invoice.items} />

      <section className="invoice-print-totals">
        <div>
          <span>{t("invoices.print.subtotal")}</span>
          <span>
            {formatInvoicePrintCurrency(invoice.subtotal, locale)}
          </span>
        </div>

        <div>
          <span>{t("invoices.print.discount")}</span>
          <span>{invoice.discount} %</span>
        </div>

        <div>
          <span>{t("invoices.print.tax")}</span>
          <span>{invoice.tax} %</span>
        </div>

        <div className="invoice-print-total">
          <strong>{t("invoices.print.totalAmount")}</strong>
          <strong>
            {formatInvoicePrintCurrency(invoice.total, locale)}
          </strong>
        </div>
      </section>

      {invoice.notes && (
        <section className="invoice-print-notes">
          <h2>{t("invoices.print.notes")}</h2>
          <p>{invoice.notes}</p>
        </section>
      )}

      <footer className="invoice-print-footer">
        <div>
          <strong>Nexus Events</strong>
          <span>{t("invoices.print.subtitle")}</span>
        </div>

        <div>
          <span>{t("invoices.print.thankYou")}</span>
          <span>{t("invoices.print.paymentNotice")}</span>
        </div>
      </footer>
    </article>
  );
}
