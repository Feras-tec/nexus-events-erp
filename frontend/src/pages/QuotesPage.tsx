import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { ListLayout } from "../components/templates/ListLayout";
import { QuoteForm } from "../features/quotes/components/QuoteForm";
import { QuoteTable } from "../features/quotes/components/QuoteTable";
import { QuoteStats } from "../features/quotes/components/QuoteStats";
import {
  QuoteFilters,
  type QuoteStatusFilter,
} from "../features/quotes/components/QuoteFilters";
import { useCreateQuote } from "../features/quotes/hooks/useCreateQuote";
import { useQuoteFormOptions } from "../features/quotes/hooks/useQuoteFormOptions";
import { useQuotes } from "../features/quotes/hooks/useQuotes";
import type { QuoteFormData } from "../features/quotes/types/quote.types";

export function QuotesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<QuoteStatusFilter>("ALL");
  const [customerFilter, setCustomerFilter] = useState("ALL");
  const [eventFilter, setEventFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);

  const {
    quotes,
    isLoading,
    isError,
  } = useQuotes();

  const {
    customers,
    events,
    products,
    isLoading: optionsLoading,
    isError: optionsError,
  } = useQuoteFormOptions();

  const {
    createQuote,
    isCreating,
    createError,
  } = useCreateQuote();

  const filterCustomers = Array.from(
    new Map(
      quotes.map((quote) => {
        const customer = quote.customer;

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
      quotes
        .filter((quote) => quote.event != null)
        .map((quote) => {
          const event = quote.event!;

          return [
            event.id,
            { id: event.id, name: event.name },
          ] as const;
        })
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const normalizedSearch = search.trim().toLowerCase();

  const filteredQuotes = quotes.filter((quote) => {
    if (
      statusFilter !== "ALL" &&
      quote.status !== statusFilter
    ) {
      return false;
    }

    if (
      customerFilter !== "ALL" &&
      quote.customer.id !== customerFilter
    ) {
      return false;
    }

    if (
      eventFilter !== "ALL" &&
      quote.event?.id !== eventFilter
    ) {
      return false;
    }

    if (!normalizedSearch) return true;

    const customerName = quote.customer.companyName
      ? quote.customer.companyName
      : [
          quote.customer.firstName,
          quote.customer.lastName,
        ]
          .filter(Boolean)
          .join(" ");

    const searchableText = [
      quote.quoteNo,
      quote.status,
      quote.customer.customerNo,
      customerName,
      quote.event?.eventNo,
      quote.event?.name,
      quote.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  async function handleCreate(data: QuoteFormData) {
    try {
      const quote = await createQuote(data);

      setShowForm(false);

      navigate({
        to: "/quotes/$quoteId",
        params: {
          quoteId: quote.id,
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
        title={t("navigation.quotes")}
        description={t("quotes.description")}
        searchValue={search}
        searchPlaceholder={t("quotes.searchPlaceholder")}
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
            {showForm ? t("common.cancel") : `+ ${t("quotes.newQuote")}`}
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
                  {t("quotes.optionsError")}
                </div>
              )}

              {createError && (
                <div role="alert" className="alert alert-error">
                  {createError}
                </div>
              )}

              {!optionsLoading && !optionsError && (
                <QuoteForm
                  customers={customers}
                  events={events}
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
                aria-label={t("quotes.loading")}
              />
            </div>
          )}

          {isError && (
            <div role="alert" className="alert alert-error">
              {t("quotes.loadError")}
            </div>
          )}

          {!isLoading && !isError && (
            <QuoteStats quotes={quotes} />
          )}

          {!isLoading && !isError && (
            <QuoteFilters
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
            <QuoteTable
              quotes={filteredQuotes}
              onView={(quoteId) => {
                navigate({
                  to: "/quotes/$quoteId",
                  params: { quoteId },
                });
              }}
            />
          )}
        </div>
      </ListLayout>
    </motion.div>
  );
}
