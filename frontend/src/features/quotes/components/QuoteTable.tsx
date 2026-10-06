import type { Quote, QuoteStatus } from "../types/quote.types";

type QuoteTableProps = {
  quotes: Quote[];
  onView: (quoteId: string) => void;
};

const statusLabels: Record<QuoteStatus, string> = {
  DRAFT: "Entwurf",
  SENT: "Gesendet",
  ACCEPTED: "Angenommen",
  REJECTED: "Abgelehnt",
  EXPIRED: "Abgelaufen",
  CANCELLED: "Storniert",
};

function getCustomerName(quote: Quote) {
  if (quote.customer.companyName) {
    return quote.customer.companyName;
  }

  return [quote.customer.firstName, quote.customer.lastName]
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

export function QuoteTable({
  quotes,
  onView,
}: QuoteTableProps) {
  if (quotes.length === 0) {
    return (
      <div className="py-12 text-center text-base-content/60">
        Keine Angebote gefunden.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table className="table">
        <thead>
          <tr>
            <th>Angebotsnr.</th>
            <th>Kunde</th>
            <th>Event</th>
            <th>Status</th>
            <th>Gültig bis</th>
            <th className="text-right">Gesamt</th>
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
                  {statusLabels[quote.status]}
                </span>
              </td>

              <td>{formatDate(quote.validUntil)}</td>

              <td className="text-right font-medium">
                {formatCurrency(quote.total)}
              </td>

              <td className="text-right">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => onView(quote.id)}
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
