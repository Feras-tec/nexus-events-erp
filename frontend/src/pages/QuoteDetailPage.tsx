import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "@tanstack/react-router";
import { motion } from "motion/react";

import { QuoteCancelAction } from "../features/quotes/components/QuoteCancelAction";
import { QuoteEmailAction } from "../features/quotes/components/QuoteEmailAction";
import { QuoteForm } from "../features/quotes/components/QuoteForm";
import { QuotePrintAction } from "../features/quotes/components/QuotePrintAction";
import { QuotePrintDocument } from "../features/quotes/components/QuotePrintDocument";
import { QuoteRestoreAction } from "../features/quotes/components/QuoteRestoreAction";
import { useQuoteDetail } from "../features/quotes/hooks/useQuoteDetail";
import { useQuoteFormOptions } from "../features/quotes/hooks/useQuoteFormOptions";
import { useUpdateQuote } from "../features/quotes/hooks/useUpdateQuote";
import { quoteToFormData } from "../features/quotes/utils/quote-form";
import { formatQuoteCurrency } from "../features/quotes/utils/quote-calculations";

function formatDate(
  value: string | null | undefined,
  language: string,
) {
  if (!value) return "—";

  const locale = language.startsWith("ar")
    ? "ar"
    : language.startsWith("en")
      ? "en-GB"
      : "de-DE";

  return new Intl.DateTimeFormat(locale).format(new Date(value));
}

export function QuoteDetailPage() {
  const { t, i18n } = useTranslation();
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
          ← {t("quotes.detail.back")}
        </button>

        <div role="alert" className="alert alert-error">
          {t("quotes.detail.loadError")}
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
    <>
      {createPortal(
        <div
          id="quote-print-document"
          className="quote-print-container"
          aria-hidden="true"
        >
          <QuotePrintDocument quote={quote} />
        </div>,
        document.body,
      )}

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
        ← {t("quotes.detail.back")}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-base-content/60">
            {t("quotes.detail.quote")}
          </p>
          <h1 className="text-3xl font-bold">
            {quote.quoteNo}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-lg badge-outline">
            {t(`quotes.statuses.${quote.status}`)}
          </span>

          <QuotePrintAction />

          <QuoteEmailAction
            quoteId={quote.id}
            customerEmail={quote.customer.email}
            lastSentAt={quote.lastSentAt}
            lastSentTo={quote.lastSentTo}
            disabled={quote.status === "CANCELLED"}
          />

          {quote.status === "CANCELLED" && (
            <QuoteRestoreAction
              quoteId={quote.id}
              quoteNo={quote.quoteNo}
            />
          )}

          {quote.status !== "CANCELLED" && (
            <>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  setIsEditing((current) => !current)
                }
              >
                {isEditing
                  ? t("quotes.detail.closeEdit")
                  : t("quotes.detail.edit")}
              </button>

              {!isEditing && (
                <QuoteCancelAction
                  quoteId={quote.id}
                  quoteNo={quote.quoteNo}
                />
              )}
            </>
          )}
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
              {t("quotes.detail.optionsError")}
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
              submitLabel={t("quotes.detail.saveChanges")}
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
              {t("quotes.detail.cancelEdit")}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              {t("quotes.detail.customer")}
            </span>
            <strong>{customerName || "—"}</strong>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              {t("quotes.detail.event")}
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
              {t("quotes.detail.validUntil")}
            </span>
            <strong>{formatDate(quote.validUntil, i18n.language)}</strong>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              {t("quotes.detail.total")}
            </span>
            <strong>{formatQuoteCurrency(quote.total, i18n.language)}</strong>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>{t("quotes.detail.type")}</th>
              <th>{t("quotes.detail.description")}</th>
              <th className="text-right">{t("quotes.detail.quantity")}</th>
              <th className="text-right">{t("quotes.detail.unitPrice")}</th>
              <th className="text-right">{t("quotes.detail.discount")}</th>
              <th className="text-right">{t("quotes.detail.total")}</th>
            </tr>
          </thead>

          <tbody>
            {quote.items.map((item) => (
              <tr key={item.id}>
                <td>{t(`quotes.items.types.${item.type}`)}</td>
                <td>{item.description}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">
                  {formatQuoteCurrency(item.unitPrice, i18n.language)}
                </td>
                <td className="text-right">
                  {item.discount} %
                </td>
                <td className="text-right font-medium">
                  {formatQuoteCurrency(item.total, i18n.language)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body ml-auto w-full max-w-md">
          <div className="flex justify-between">
            <span>{t("quotes.detail.subtotal")}</span>
            <span>{formatQuoteCurrency(quote.subtotal, i18n.language)}</span>
          </div>

          <div className="flex justify-between">
            <span>{t("quotes.detail.discount")}</span>
            <span>{quote.discount} %</span>
          </div>

          <div className="flex justify-between">
            <span>{t("quotes.detail.tax")}</span>
            <span>{quote.tax} %</span>
          </div>

          <div className="divider my-1" />

          <div className="flex justify-between text-lg font-bold">
            <span>{t("quotes.detail.total")}</span>
            <span>{formatQuoteCurrency(quote.total, i18n.language)}</span>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title">{t("quotes.detail.notes")}</h2>
            <p className="whitespace-pre-wrap">{quote.notes}</p>
          </div>
        </div>
      )}
      </motion.div>
    </>
  );
}
