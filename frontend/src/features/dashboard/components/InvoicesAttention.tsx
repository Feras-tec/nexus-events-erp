import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { Invoice } from "../../invoices/types/invoice.types";

type InvoicesAttentionProps = {
  invoices: Invoice[];
  isLoading: boolean;
  isError: boolean;
};

export function InvoicesAttention({
  invoices,
  isLoading,
  isError,
}: InvoicesAttentionProps) {
  const { t, i18n } = useTranslation();

  const now = Date.now();

  const attentionInvoices = invoices
    .filter((invoice) =>
      invoice.status === "ISSUED" ||
      invoice.status === "OVERDUE"
    )
    .sort((a, b) => {
      const dateA = a.dueDate
        ? new Date(a.dueDate).getTime()
        : Number.MAX_SAFE_INTEGER;

      const dateB = b.dueDate
        ? new Date(b.dueDate).getTime()
        : Number.MAX_SAFE_INTEGER;

      return dateA - dateB;
    })
    .slice(0, 5);

  function isOverdue(invoice: Invoice) {
    if (invoice.status === "OVERDUE") {
      return true;
    }

    if (!invoice.dueDate) {
      return false;
    }

    const dueDate = new Date(invoice.dueDate).getTime();

    return Number.isFinite(dueDate) && dueDate < now;
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat(i18n.language, {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }

  function formatDate(value?: string | null) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat(i18n.language, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  return (
    <section className="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          {t("dashboard.invoicesAttention")}
        </h2>

        <Link
          to="/invoices"
          className="btn btn-ghost btn-sm"
        >
          {t("dashboard.viewAll")}
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : isError ? (
        <p className="text-sm text-error">
          {t("dashboard.invoicesLoadError")}
        </p>
      ) : attentionInvoices.length === 0 ? (
        <p className="py-8 text-center text-sm text-base-content/60">
          {t("dashboard.noInvoicesAttention")}
        </p>
      ) : (
        <div className="space-y-3">
          {attentionInvoices.map((invoice) => {
            const overdue = isOverdue(invoice);

            return (
              <Link
                key={invoice.id}
                to="/invoices/$invoiceId"
                params={{ invoiceId: invoice.id }}
                className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-base-300 p-3 transition-colors hover:bg-base-200"
              >
                <div className="min-w-0">
                  <p className="break-words font-semibold">
                    {invoice.invoiceNo}
                  </p>

                  <p className="mt-1 text-xs text-base-content/60">
                    {t("dashboard.dueDate")}:{" "}
                    {formatDate(invoice.dueDate)}
                  </p>

                  <p className="mt-1 font-medium">
                    {formatCurrency(Number(invoice.total))}
                  </p>
                </div>

                <span
                  className={`badge ${
                    overdue
                      ? "badge-error"
                      : "badge-warning"
                  }`}
                >
                  {overdue
                    ? t("dashboard.overdue")
                    : t("dashboard.unpaid")}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
