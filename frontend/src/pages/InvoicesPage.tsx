import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";

import { InvoiceForm } from "../components/organisms/InvoiceForm";
import { ListLayout } from "../components/templates/ListLayout";
import { InvoiceTable } from "../features/invoices/components/InvoiceTable";
import { InvoiceStats } from "../features/invoices/components/InvoiceStats";
import {
  InvoiceFilters,
  type InvoiceStatusFilter,
} from "../features/invoices/components/InvoiceFilters";
import { useCreateInvoice } from "../features/invoices/hooks/useCreateInvoice";
import { useInvoiceFormOptions } from "../features/invoices/hooks/useInvoiceFormOptions";
import { useInvoices } from "../features/invoices/hooks/useInvoices";
import type { InvoiceFormData } from "../features/invoices/types/invoice.types";

export function InvoicesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<InvoiceStatusFilter>("ALL");
  const [customerFilter, setCustomerFilter] = useState("ALL");
  const [eventFilter, setEventFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);

  const {
    invoices,
    isLoading,
    isError,
  } = useInvoices();

  const {
    customers,
    events,
    quotes,
    products,
    isLoading: optionsLoading,
    isError: optionsError,
  } = useInvoiceFormOptions();

  const {
    createInvoice,
    isCreating,
    createError,
  } = useCreateInvoice();

  const filterCustomers = Array.from(
    new Map(
      invoices.map((invoice) => {
        const customer = invoice.customer;
        const name =
          customer.companyName ||
          [customer.firstName, customer.lastName]
            .filter(Boolean)
            .join(" ") ||
          customer.customerNo;

        return [
          customer.id,
          { id: customer.id, name },
        ] as const;
      })
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filterEvents = Array.from(
    new Map(
      invoices
        .filter((invoice) => invoice.event != null)
        .map((invoice) => {
          const event = invoice.event!;

          return [
            event.id,
            { id: event.id, name: event.name },
          ] as const;
        })
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const normalizedSearch = search.trim().toLowerCase();

  const filteredInvoices = invoices.filter((invoice) => {
    if (
      statusFilter !== "ALL" &&
      invoice.status !== statusFilter
    ) {
      return false;
    }

    if (
      customerFilter !== "ALL" &&
      invoice.customer.id !== customerFilter
    ) {
      return false;
    }

    if (
      eventFilter !== "ALL" &&
      invoice.event?.id !== eventFilter
    ) {
      return false;
    }

    if (!normalizedSearch) return true;

    const customerName = invoice.customer.companyName
      ? invoice.customer.companyName
      : [
          invoice.customer.firstName,
          invoice.customer.lastName,
        ]
          .filter(Boolean)
          .join(" ");

    const searchableText = [
      invoice.invoiceNo,
      invoice.status,
      invoice.customer.customerNo,
      customerName,
      invoice.event?.eventNo,
      invoice.event?.name,
      invoice.quote?.quoteNo,
      invoice.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  async function handleCreate(data: InvoiceFormData) {
    try {
      const invoice = await createInvoice(data);

      setShowForm(false);

      navigate({
        to: "/invoices/$invoiceId",
        params: {
          invoiceId: invoice.id,
        },
      });
    } catch {
      // Fehlermeldung wird über createError angezeigt.
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <ListLayout
        title={t("invoices.title")}
        description={t("invoices.description")}
        searchValue={search}
        searchPlaceholder={t("invoices.searchPlaceholder")}
        onSearchChange={setSearch}
        actions={
          <button
            type="button"
            className={
              showForm
                ? "btn btn-ghost"
                : "btn btn-primary"
            }
            onClick={() => setShowForm((current) => !current)}
          >
            {showForm ? t("common.cancel") : `+ ${t("invoices.newInvoice")}`}
          </button>
        }
      >
        <div className="space-y-6">
          {showForm && (
            <div className="space-y-4">
              {optionsLoading && (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg" />
                </div>
              )}

              {optionsError && (
                <div role="alert" className="alert alert-error">
                  {t("invoices.optionsError")}
                </div>
              )}

              {createError && (
                <div role="alert" className="alert alert-error">
                  {createError}
                </div>
              )}

              {!optionsLoading && !optionsError && (
                <InvoiceForm
                  customers={customers}
                  events={events}
                  quotes={quotes}
                  products={products}
                  loading={isCreating}
                  onSubmit={handleCreate}
                />
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center py-12">
              <span
                className="loading loading-spinner loading-lg"
                aria-label={t("invoices.loading")}
              />
            </div>
          )}

          {isError && (
            <div role="alert" className="alert alert-error">
              {t("invoices.loadError")}
            </div>
          )}

          {!isLoading && !isError && (
            <InvoiceStats invoices={invoices} />
          )}

          {!isLoading && !isError && (
            <InvoiceFilters
              status={statusFilter}
              customerId={customerFilter}
              eventId={eventFilter}
              customers={filterCustomers}
              events={filterEvents}
              onStatusChange={setStatusFilter}
              onCustomerChange={setCustomerFilter}
              onEventChange={setEventFilter}
              onReset={() => {
                setStatusFilter("ALL");
                setCustomerFilter("ALL");
                setEventFilter("ALL");
              }}
            />
          )}

          {!isLoading && !isError && (
            <InvoiceTable
              invoices={filteredInvoices}
              onView={(invoiceId) => {
                navigate({
                  to: "/invoices/$invoiceId",
                  params: { invoiceId },
                });
              }}
            />
          )}
        </div>
      </ListLayout>
    </motion.div>
  );
}
