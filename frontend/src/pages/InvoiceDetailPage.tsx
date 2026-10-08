import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "@tanstack/react-router";
import { motion } from "motion/react";

import { InvoiceSummary } from "../components/molecules/InvoiceSummary";
import { InvoiceForm } from "../components/organisms/InvoiceForm";
import { InvoicePrintAction } from "../features/invoices/components/InvoicePrintAction";
import { InvoicePrintDocument } from "../features/invoices/components/InvoicePrintDocument";
import { useInvoiceDetail } from "../features/invoices/hooks/useInvoiceDetail";
import { useInvoiceFormOptions } from "../features/invoices/hooks/useInvoiceFormOptions";
import { useUpdateInvoice } from "../features/invoices/hooks/useUpdateInvoice";
import { useSendInvoiceEmail } from "../features/invoices/hooks/useSendInvoiceEmail";
import type {
  InvoiceFormData,
} from "../features/invoices/types/invoice.types";

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

export function InvoiceDetailPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const locale = language.startsWith("ar")
    ? "ar"
    : language.startsWith("en")
      ? "en-GB"
      : "de-DE";
  const [isEditing, setIsEditing] = useState(false);

  const {
    sendInvoiceEmail,
    isSending,
    sendError,
  } = useSendInvoiceEmail();

  const { invoiceId } = useParams({
    strict: false,
  });

  const {
    invoice,
    isLoading,
    isError,
  } = useInvoiceDetail(invoiceId ?? "");

  const {
    customers,
    events,
    quotes,
    products,
    isLoading: areOptionsLoading,
    isError: areOptionsError,
  } = useInvoiceFormOptions();

  const {
    updateInvoice,
    isUpdating,
    updateError,
  } = useUpdateInvoice();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => navigate({ to: "/invoices" })}
        >
          {t("common.back")}
        </button>

        <div role="alert" className="alert alert-error">
          {t("invoices.detail.loadError")}
        </div>
      </div>
    );
  }

  const customerName =
    invoice.customer.companyName ||
    [
      invoice.customer.firstName,
      invoice.customer.lastName,
    ]
      .filter(Boolean)
      .join(" ");

  const toDateInputValue = (value?: string | null) =>
    value ? value.slice(0, 10) : "";

  const initialFormData = {
    invoiceNo: invoice.invoiceNo,
    status: invoice.status,
    issueDate: toDateInputValue(invoice.issueDate),
    dueDate: toDateInputValue(invoice.dueDate),
    notes: invoice.notes ?? "",
    customerId: invoice.customerId,
    eventId: invoice.eventId ?? "",
    quoteId: invoice.quoteId ?? "",
    tax: Number(invoice.tax),
    discount: Number(invoice.discount),
    items: invoice.items.map((item) => ({
      type: item.type,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      productId: item.productId ?? undefined,
    })),
  };

  async function handleUpdate(
    data: InvoiceFormData,
  ) {
    if (!invoiceId) return;

    await updateInvoice({
      invoiceId,
      data,
    });

    setIsEditing(false);
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div
        id="invoice-print-document"
        className="hidden print:block"
        aria-hidden="true"
      >
        <InvoicePrintDocument invoice={invoice} />
      </div>

      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => navigate({ to: "/invoices" })}
      >
        {t("invoices.detail.back")}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-base-content/60">
            {t("invoices.detail.invoice")}
          </p>

          <h1 className="text-3xl font-bold">
            {invoice.invoiceNo}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-lg badge-outline">
            {t(`status.${invoice.status}`)}
          </span>

          <button
            type="button"
            className="btn btn-outline w-36"
            onClick={() => setIsEditing((current) => !current)}
          >
            {isEditing ? t("common.cancel") : t("common.edit")}
          </button>

          <InvoicePrintAction />

          <button
            type="button"
            className="btn btn-outline h-auto min-h-10 min-w-36 px-4 py-2 whitespace-nowrap"
            disabled={isSending}
            onClick={async () => {
              await sendInvoiceEmail({
                invoiceId: invoice.id,
              });
            }}
          >
            {isSending ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                {t("invoices.detail.sending")}
              </>
            ) : (
              t("invoices.detail.sendEmail")
            )}
          </button>
        </div>
      </div>

      {sendError && (
        <div role="alert" className="alert alert-error">
          {sendError}
        </div>
      )}

      {isEditing && (
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <h2 className="card-title">
              {t("invoices.detail.editInvoice")}
            </h2>

            {areOptionsLoading && (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg" />
              </div>
            )}

            {areOptionsError && (
              <div role="alert" className="alert alert-error">
                {t("invoices.detail.formOptionsError")}
              </div>
            )}

            {updateError && (
              <div role="alert" className="alert alert-error">
                {updateError}
              </div>
            )}

            {!areOptionsLoading && !areOptionsError && (
              <InvoiceForm
                key={invoice.updatedAt}
                customers={customers}
                events={events}
                quotes={quotes}
                products={products}
                initialData={initialFormData}
                loading={isUpdating}
                submitLabel={t("invoices.detail.saveChanges")}
                onSubmit={handleUpdate}
              />
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              {t("invoices.table.customer")}
            </span>

            <strong>{customerName || "—"}</strong>
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              {t("invoices.table.event")}
            </span>

            <strong>
              {invoice.event
                ? `${invoice.event.eventNo} · ${invoice.event.name}`
                : "—"}
            </strong>
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              {t("invoices.table.dueDate")}
            </span>

            <strong>{formatDate(invoice.dueDate, locale)}</strong>
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              {t("invoices.table.total")}
            </span>

            <strong>{formatCurrency(invoice.total, locale)}</strong>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              {t("invoices.table.issueDate")}
            </span>

            <strong>{formatDate(invoice.issueDate, locale)}</strong>
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              {t("invoices.detail.quote")}
            </span>

            <strong>
              {invoice.quote?.quoteNo ?? "—"}
            </strong>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>{t("invoices.detail.type")}</th>
              <th>{t("invoices.detail.description")}</th>
              <th className="text-right">{t("invoices.detail.quantity")}</th>
              <th className="text-right">{t("invoices.detail.unitPrice")}</th>
              <th className="text-right">{t("invoices.detail.discount")}</th>
              <th className="text-right">{t("invoices.table.total")}</th>
            </tr>
          </thead>

          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id ?? `${item.description}-${index}`}>
                <td>{t(`invoices.itemTypes.${item.type}`, { defaultValue: item.type })}</td>

                <td>{item.description}</td>

                <td className="text-right">
                  {item.quantity}
                </td>

                <td className="text-right">
                  {formatCurrency(item.unitPrice, locale)}
                </td>

                <td className="text-right">
                  {item.discount} %
                </td>

                <td className="text-right font-medium">
                  {formatCurrency(item.total ?? 0, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InvoiceSummary
        subtotal={invoice.subtotal}
        discount={invoice.discount}
        tax={invoice.tax}
        total={invoice.total}
      />

      {invoice.notes && (
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <h2 className="card-title">{t("invoices.detail.notes")}</h2>

            <p className="whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
