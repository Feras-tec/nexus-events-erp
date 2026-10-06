import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { motion } from "motion/react";

import { InvoiceForm } from "../components/organisms/InvoiceForm";
import { InvoicePrintAction } from "../features/invoices/components/InvoicePrintAction";
import { InvoicePrintDocument } from "../features/invoices/components/InvoicePrintDocument";
import { useInvoiceDetail } from "../features/invoices/hooks/useInvoiceDetail";
import { useInvoiceFormOptions } from "../features/invoices/hooks/useInvoiceFormOptions";
import { useUpdateInvoice } from "../features/invoices/hooks/useUpdateInvoice";
import type {
  InvoiceFormData,
  InvoiceStatus,
} from "../features/invoices/types/invoice.types";

const statusLabels: Record<InvoiceStatus, string> = {
  DRAFT: "Entwurf",
  ISSUED: "Ausgestellt",
  PAID: "Bezahlt",
  OVERDUE: "Überfällig",
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

export function InvoiceDetailPage() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

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
          ← Zurück
        </button>

        <div role="alert" className="alert alert-error">
          Rechnung konnte nicht geladen werden.
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
        ← Zurück zu Rechnungen
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-base-content/60">
            Rechnung
          </p>

          <h1 className="text-3xl font-bold">
            {invoice.invoiceNo}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-lg badge-outline">
            {statusLabels[invoice.status]}
          </span>

          <button
            type="button"
            className="btn btn-outline w-36"
            onClick={() => setIsEditing((current) => !current)}
          >
            {isEditing ? "Abbrechen" : "Bearbeiten"}
          </button>

          <InvoicePrintAction />
        </div>
      </div>

      {isEditing && (
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <h2 className="card-title">
              Rechnung bearbeiten
            </h2>

            {areOptionsLoading && (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg" />
              </div>
            )}

            {areOptionsError && (
              <div role="alert" className="alert alert-error">
                Formulardaten konnten nicht geladen werden.
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
                submitLabel="Änderungen speichern"
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
              Kunde
            </span>

            <strong>{customerName || "—"}</strong>
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              Event
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
              Fällig am
            </span>

            <strong>{formatDate(invoice.dueDate)}</strong>
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              Gesamt
            </span>

            <strong>{formatCurrency(invoice.total)}</strong>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              Rechnungsdatum
            </span>

            <strong>{formatDate(invoice.issueDate)}</strong>
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <span className="text-sm text-base-content/60">
              Angebot
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
              <th>Typ</th>
              <th>Beschreibung</th>
              <th className="text-right">Menge</th>
              <th className="text-right">Einzelpreis</th>
              <th className="text-right">Rabatt</th>
              <th className="text-right">Gesamt</th>
            </tr>
          </thead>

          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id ?? `${item.description}-${index}`}>
                <td>{item.type}</td>

                <td>{item.description}</td>

                <td className="text-right">
                  {item.quantity}
                </td>

                <td className="text-right">
                  {formatCurrency(item.unitPrice)}
                </td>

                <td className="text-right">
                  {item.discount} %
                </td>

                <td className="text-right font-medium">
                  {formatCurrency(item.total ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card border border-base-300 bg-base-100">
        <div className="card-body ml-auto w-full max-w-md">
          <div className="flex justify-between">
            <span>Zwischensumme</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>

          <div className="flex justify-between">
            <span>Rabatt</span>
            <span>{invoice.discount} %</span>
          </div>

          <div className="flex justify-between">
            <span>MwSt.</span>
            <span>{invoice.tax} %</span>
          </div>

          <div className="divider my-1" />

          <div className="flex justify-between text-lg font-bold">
            <span>Gesamt</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <h2 className="card-title">Notizen</h2>

            <p className="whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
