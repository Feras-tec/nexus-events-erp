import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";

import { InvoiceForm } from "../components/organisms/InvoiceForm";
import { ListLayout } from "../components/templates/ListLayout";
import { InvoiceTable } from "../features/invoices/components/InvoiceTable";
import { useCreateInvoice } from "../features/invoices/hooks/useCreateInvoice";
import { useInvoiceFormOptions } from "../features/invoices/hooks/useInvoiceFormOptions";
import { useInvoices } from "../features/invoices/hooks/useInvoices";
import type { InvoiceFormData } from "../features/invoices/types/invoice.types";

export function InvoicesPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
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

  const normalizedSearch = search.trim().toLowerCase();

  const filteredInvoices = invoices.filter((invoice) => {
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
        title="Rechnungen"
        description="Rechnungen für Kunden und Events verwalten."
        searchValue={search}
        searchPlaceholder="Rechnungen suchen..."
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
            {showForm ? "Abbrechen" : "+ Neue Rechnung"}
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
                  Kunden, Events, Angebote oder Produkte konnten nicht geladen werden.
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
                aria-label="Rechnungen werden geladen"
              />
            </div>
          )}

          {isError && (
            <div role="alert" className="alert alert-error">
              Rechnungen konnten nicht geladen werden.
            </div>
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
