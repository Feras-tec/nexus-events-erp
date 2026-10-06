type QuoteEmailItem = {
  description: string;
  quantity: unknown;
  unitPrice: unknown;
  discount: unknown;
  total: unknown;
};

type QuoteEmailData = {
  quoteNo: string;
  validUntil: Date | null;
  notes: string | null;
  subtotal: unknown;
  discount: unknown;
  tax: unknown;
  total: unknown;
  customer: {
    companyName: string | null;
    firstName: string | null;
    lastName: string | null;
    contactName: string | null;
  };
  event: {
    eventNo: string;
    name: string;
  } | null;
  items: QuoteEmailItem[];
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const money = (value: unknown) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));

const number = (value: unknown) =>
  new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 2,
  }).format(Number(value));

const date = (value: Date) =>
  new Intl.DateTimeFormat("de-DE").format(value);

export function buildQuoteEmailHtml(quote: QuoteEmailData) {
  const customerName =
    quote.customer.companyName ||
    quote.customer.contactName ||
    [quote.customer.firstName, quote.customer.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Kunde";

  const itemRows = quote.items
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.description)}</td>
          <td style="text-align:right">${number(item.quantity)}</td>
          <td style="text-align:right">${money(item.unitPrice)}</td>
          <td style="text-align:right">${number(item.discount)} %</td>
          <td style="text-align:right"><strong>${money(item.total)}</strong></td>
        </tr>
      `,
    )
    .join("");

  return `
    <!doctype html>
    <html lang="de">
      <body style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.5">
        <div style="max-width:760px;margin:0 auto">
          <h1 style="margin-bottom:4px">Angebot ${escapeHtml(quote.quoteNo)}</h1>
          <p style="margin-top:0;color:#6b7280">Nexus Events · Event Management</p>

          <p>Guten Tag ${escapeHtml(customerName)},</p>

          <p>
            vielen Dank für Ihre Anfrage. Nachfolgend erhalten Sie unser Angebot
            <strong>${escapeHtml(quote.quoteNo)}</strong>.
          </p>

          ${
            quote.event
              ? `<p><strong>Event:</strong> ${escapeHtml(
                  quote.event.eventNo,
                )} · ${escapeHtml(quote.event.name)}</p>`
              : ""
          }

          ${
            quote.validUntil
              ? `<p><strong>Gültig bis:</strong> ${date(quote.validUntil)}</p>`
              : ""
          }

          <table
            style="width:100%;border-collapse:collapse;margin:24px 0"
            cellpadding="8"
          >
            <thead>
              <tr style="border-bottom:2px solid #111827">
                <th style="text-align:left">Pos.</th>
                <th style="text-align:left">Beschreibung</th>
                <th style="text-align:right">Menge</th>
                <th style="text-align:right">Einzelpreis</th>
                <th style="text-align:right">Rabatt</th>
                <th style="text-align:right">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <div style="margin-left:auto;max-width:320px">
            <p>Zwischensumme: <strong>${money(quote.subtotal)}</strong></p>
            <p>Rabatt: <strong>${number(quote.discount)} %</strong></p>
            <p>MwSt.: <strong>${number(quote.tax)} %</strong></p>
            <p style="font-size:18px">
              Gesamt: <strong>${money(quote.total)}</strong>
            </p>
          </div>

          ${
            quote.notes
              ? `<p><strong>Notizen:</strong><br>${escapeHtml(quote.notes)}</p>`
              : ""
          }

          <p style="margin-top:32px">
            Vielen Dank für Ihre Anfrage.
          </p>

          <p>
            Mit freundlichen Grüßen<br>
            <strong>Nexus Events</strong>
          </p>
        </div>
      </body>
    </html>
  `;
}
