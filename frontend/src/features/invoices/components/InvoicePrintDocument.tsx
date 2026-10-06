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
  return (
    <article className="invoice-print-sheet">
      <header className="invoice-print-header">
        <div>
          <p className="invoice-print-brand">NEXUS EVENTS</p>
          <p className="invoice-print-subtitle">
            Event Production & Management
          </p>
        </div>

        <div className="invoice-print-title">
          <h1>RECHNUNG</h1>
          <strong>{invoice.invoiceNo}</strong>
        </div>
      </header>

      <section className="invoice-print-meta">
        <div>
          <span>Kunde</span>
          <strong>{getCustomerName(invoice)}</strong>

          {invoice.customer.customerNo && (
            <small>{invoice.customer.customerNo}</small>
          )}

          {invoice.customer.email && (
            <small>{invoice.customer.email}</small>
          )}
        </div>

        <div>
          <span>Rechnungsdatum</span>
          <strong>
            {formatInvoicePrintDate(invoice.issueDate)}
          </strong>

          <span>Fällig am</span>
          <strong>
            {formatInvoicePrintDate(invoice.dueDate)}
          </strong>

          <span>Erstellt am</span>
          <strong>
            {new Intl.DateTimeFormat("de-DE", {
              dateStyle: "short",
              timeStyle: "short",
            }).format(new Date(invoice.createdAt))}
          </strong>
        </div>
      </section>

      {(invoice.event || invoice.quote) && (
        <section className="invoice-print-reference">
          {invoice.event && (
            <div>
              <span>Event</span>
              <strong>
                {invoice.event.eventNo} · {invoice.event.name}
              </strong>
            </div>
          )}

          {invoice.quote && (
            <div>
              <span>Angebot</span>
              <strong>{invoice.quote.quoteNo}</strong>
            </div>
          )}
        </section>
      )}

      <InvoicePrintItems items={invoice.items} />

      <section className="invoice-print-totals">
        <div>
          <span>Zwischensumme</span>
          <span>
            {formatInvoicePrintCurrency(invoice.subtotal)}
          </span>
        </div>

        <div>
          <span>Rabatt</span>
          <span>{invoice.discount} %</span>
        </div>

        <div>
          <span>MwSt.</span>
          <span>{invoice.tax} %</span>
        </div>

        <div className="invoice-print-total">
          <strong>Gesamtbetrag</strong>
          <strong>
            {formatInvoicePrintCurrency(invoice.total)}
          </strong>
        </div>
      </section>

      {invoice.notes && (
        <section className="invoice-print-notes">
          <h2>Notizen</h2>
          <p>{invoice.notes}</p>
        </section>
      )}

      <footer className="invoice-print-footer">
        <div>
          <strong>Nexus Events</strong>
          <span>Event Production & Management</span>
        </div>

        <div>
          <span>Vielen Dank für Ihren Auftrag.</span>
          <span>
            Bitte überweisen Sie den Rechnungsbetrag bis zum
            angegebenen Fälligkeitsdatum.
          </span>
        </div>
      </footer>
    </article>
  );
}
