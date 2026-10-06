import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { motion } from "motion/react";

import { QuoteForm } from "../features/quotes/components/QuoteForm";
import { useQuoteDetail } from "../features/quotes/hooks/useQuoteDetail";
import { useQuoteFormOptions } from "../features/quotes/hooks/useQuoteFormOptions";
import { useUpdateQuote } from "../features/quotes/hooks/useUpdateQuote";
import { quoteToFormData } from "../features/quotes/utils/quote-form";
import type { QuoteStatus } from "../features/quotes/types/quote.types";

const statusLabels: Record<QuoteStatus, string> = {
  DRAFT: "Entwurf",
  SENT: "Gesendet",
  ACCEPTED: "Angenommen",
  REJECTED: "Abgelehnt",
  EXPIRED: "Abgelaufen",
  CANCELLED: "Storniert",
};

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

export function QuoteDetailPage() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const { quoteId } = useParams({
    strict: false,
  });

  const {
    quote,
    isLoading,
    isError,
  } = useQuoteDetail(quoteId ?? "");

  const {
    updateQuote,
    isUpdating,
    updateError,
  } = useUpdateQuote();

  const {
    customers,
    events,
    products,
    isLoading: optionsLoading,
    isError: optionsError,
  } = useQuoteFormOptions();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (isError || !quote) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => navigate({ to: "/quotes" })}
        >
          ← Zurück
        </button>

        <div role="alert" className="alert alert-error">
          Angebot konnte nicht geladen werden.
        </div>
      </div>
    );
  }

  const customerName =
    quote.customer.companyName ||
    [quote.customer.firstName, quote.customer.lastName]
      .filter(Boolean)
      .join(" ");

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => navigate({ to: "/quotes" })}
      >
        ← Zurück zu Angebote
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-base-content/60">
            Angebot
          </p>
          <h1 className="text-3xl font-bold">
            {quote.quoteNo}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-lg badge-outline">
            {statusLabels[quote.status]}
          </span>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsEditing((current) => !current)}
          >
            {isEditing ? "Bearbeiten schließen" : "Bearbeiten"}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="space-y-4">
          {optionsLoading && (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg" />
            </div>
          )}

          {optionsError && (
            <div role="alert" className="alert alert-error">
              Kunden, Events oder Produkte konnten nicht geladen werden.
            </div>
          )}

          {updateError && (
            <div role="alert" className="alert alert-error">
              {updateError}
            </div>
          )}

          {!optionsLoading && !optionsError && (
            <QuoteForm
              key={quote.updatedAt}
              customers={customers}
              events={events}
              products={products}
              initialData={quoteToFormData(quote)}
              submitLabel="Änderungen speichern"
              loading={isUpdating}
              onSubmit={async (data) => {
                try {
                  await updateQuote({
                    quoteId: quote.id,
                    data,
                  });

                  setIsEditing(false);
                } catch {
                  // Fehlermeldung wird über updateError angezeigt.
                }
              }}
            />
          )}

          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={isUpdating}
              onClick={() => setIsEditing(false)}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              Kunde
            </span>
            <strong>{customerName || "—"}</strong>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              Event
            </span>
            <strong>
              {quote.event
                ? `${quote.event.eventNo} · ${quote.event.name}`
                : "—"}
            </strong>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              Gültig bis
            </span>
            <strong>{formatDate(quote.validUntil)}</strong>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              Gesamt
            </span>
            <strong>{formatCurrency(quote.total)}</strong>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>Typ</th>
              <th>Beschreibung</th>
              <th className="text-right">Menge</th>
              <th className="text-right">Einzelpreis</th>
              <th className="text-right">Rabatt</th>
              <th className="text-right">Gesamt</th>
            </tr>
          </thead>

          <tbody>
            {quote.items.map((item) => (
              <tr key={item.id}>
                <td>{item.type}</td>
                <td>{item.description}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="text-right">
                  {item.discount} %
                </td>
                <td className="text-right font-medium">
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body ml-auto w-full max-w-md">
          <div className="flex justify-between">
            <span>Zwischensumme</span>
            <span>{formatCurrency(quote.subtotal)}</span>
          </div>

          <div className="flex justify-between">
            <span>Rabatt</span>
            <span>{quote.discount} %</span>
          </div>

          <div className="flex justify-between">
            <span>MwSt.</span>
            <span>{quote.tax} %</span>
          </div>

          <div className="divider my-1" />

          <div className="flex justify-between text-lg font-bold">
            <span>Gesamt</span>
            <span>{formatCurrency(quote.total)}</span>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title">Notizen</h2>
            <p className="whitespace-pre-wrap">{quote.notes}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
