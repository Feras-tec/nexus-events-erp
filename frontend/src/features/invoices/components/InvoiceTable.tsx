import type {
  Invoice,
  InvoiceStatus,
} from "../types/invoice.types";

type InvoiceTableProps = {
  invoices: Invoice[];
  onView: (invoiceId: string) => void;
};

const statusLabels: Record<InvoiceStatus, string> = {
  DRAFT: "Entwurf",
  ISSUED: "Ausgestellt",
  PAID: "Bezahlt",
  OVERDUE: "Überfällig",
  CANCELLED: "Storniert",
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("de-DE").format(
    new Date(value),
  );
}

export function InvoiceTable({
  invoices,
  onView,
}: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="py-12 text-center text-base-content/60">
        Keine Rechnungen gefunden.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table className="table">
        <thead>
          <tr>
            <th>Rechnungsnr.</th>
            <th>Kunde</th>
            <th>Event</th>
            <th>Status</th>
            <th>Rechnungsdatum</th>
            <th>Fällig am</th>
            <th className="text-right">Gesamt</th>
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
                  {statusLabels[invoice.status]}
                </span>
              </td>

              <td>{formatDate(invoice.issueDate)}</td>

              <td>{formatDate(invoice.dueDate)}</td>

              <td className="text-right font-medium">
                {formatCurrency(invoice.total)}
              </td>

              <td className="text-right">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => onView(invoice.id)}
                >
                  Öffnen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
