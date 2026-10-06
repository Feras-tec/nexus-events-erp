import type { Quote } from "../types/quote.types";
import {
  formatQuotePrintCurrency,
  formatQuotePrintDate,
} from "../utils/quote-print";
import { QuotePrintItems } from "./QuotePrintItems";

type QuotePrintDocumentProps = {
  quote: Quote;
};

export function QuotePrintDocument({
  quote,
}: QuotePrintDocumentProps) {
  const customerName =
    quote.customer.companyName ||
    [quote.customer.firstName, quote.customer.lastName]
      .filter(Boolean)
      .join(" ");

  const printedAt = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  return (
    <article className="mx-auto w-full max-w-[210mm] bg-white p-10 text-black">
      <div className="quote-print-timestamp text-base font-bold leading-none text-black">
        Gedruckt am {printedAt}
      </div>

      <header className="flex items-start justify-between gap-8 border-b-2 border-black pb-6">
        <div>
          <p className="text-sm uppercase tracking-widest">
            Angebot
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            {quote.quoteNo}
          </h1>
        </div>

        <div className="text-right text-sm">
          <p className="text-xl font-bold">
            Nexus Events
          </p>

          <p className="mt-1">
            Event Management
          </p>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-8">
        <div>
          <p className="text-xs uppercase opacity-60">
            Kunde
          </p>

          <p className="mt-1 font-semibold">
            {customerName || "—"}
          </p>

          <p className="text-sm">
            {quote.customer.customerNo}
          </p>
        </div>

        <div className="text-right">
          <div>
            <p className="text-xs uppercase opacity-60">
              Erstellt am
            </p>

            <p className="mt-1">
              {formatQuotePrintDate(quote.createdAt)}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-xs uppercase opacity-60">
              Gültig bis
            </p>

            <p className="mt-1">
              {formatQuotePrintDate(quote.validUntil)}
            </p>
          </div>
        </div>
      </section>

      {quote.event && (
        <section className="mt-8 rounded border border-gray-300 p-4">
          <p className="text-xs uppercase opacity-60">
            Event
          </p>

          <p className="mt-1 font-semibold">
            {quote.event.eventNo} · {quote.event.name}
          </p>
        </section>
      )}

      <section className="mt-8">
        <QuotePrintItems items={quote.items} />
      </section>

      <section className="ml-auto mt-8 w-full max-w-sm space-y-2 text-sm">
        <div className="flex justify-between gap-8">
          <span>Zwischensumme</span>
          <span>
            {formatQuotePrintCurrency(
              Number(quote.subtotal),
            )}
          </span>
        </div>

        <div className="flex justify-between gap-8">
          <span>
            Rabatt ({Number(quote.discount)} %)
          </span>
          <span>
            {formatQuotePrintCurrency(
              Number(quote.subtotal) *
                (Number(quote.discount) / 100),
            )}
          </span>
        </div>

        <div className="flex justify-between gap-8">
          <span>MwSt. ({Number(quote.tax)} %)</span>
          <span>
            {formatQuotePrintCurrency(
              Number(quote.total) -
                Number(quote.subtotal) *
                  (1 - Number(quote.discount) / 100),
            )}
          </span>
        </div>

        <div className="mt-3 flex justify-between gap-8 border-t-2 border-black pt-3 text-lg font-bold">
          <span>Gesamt</span>
          <span>
            {formatQuotePrintCurrency(
              Number(quote.total),
            )}
          </span>
        </div>
      </section>

      <div className="quote-print-bottom">
        {quote.notes && (
          <section>
            <h2 className="text-base font-semibold">
              Notizen
            </h2>

            <p className="mt-2 whitespace-pre-wrap text-sm">
              {quote.notes}
            </p>
          </section>
        )}

        <footer className="mt-6 border-t border-gray-300 pt-4 text-sm font-medium text-black/70">
          <p>
            Vielen Dank für Ihre Anfrage.
          </p>
        </footer>
      </div>
    </article>
  );
}
