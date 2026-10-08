import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { QuoteStatus } from "../types/quote.types";

export type QuoteStatusFilter = QuoteStatus | "ALL";

type FilterOption = {
  id: string;
  name: string;
};

type QuoteFiltersProps = {
  status: QuoteStatusFilter;
  customerId: string;
  eventId: string;
  customers: FilterOption[];
  events: FilterOption[];
  onStatusChange: (value: QuoteStatusFilter) => void;
  onCustomerChange: (value: string) => void;
  onEventChange: (value: string) => void;
  onReset: () => void;
};

const statuses: QuoteStatus[] = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
];

export function QuoteFilters({
  status,
  customerId,
  eventId,
  customers,
  events,
  onStatusChange,
  onCustomerChange,
  onEventChange,
  onReset,
}: QuoteFiltersProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-primary" />
        <h2 className="font-semibold">
          {t("quotes.filters.title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("quotes.filters.status")}
          </span>

          <select
            name="quote-status-filter"
            className="select select-bordered w-full"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as QuoteStatusFilter)
            }
          >
            <option value="ALL">
              {t("quotes.filters.allStatuses")}
            </option>

            {statuses.map((value) => (
              <option key={value} value={value}>
                {t(`quotes.statuses.${value}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("quotes.filters.customer")}
          </span>

          <select
            name="quote-customer-filter"
            className="select select-bordered w-full"
            value={customerId}
            onChange={(event) => onCustomerChange(event.target.value)}
          >
            <option value="ALL">
              {t("quotes.filters.allCustomers")}
            </option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("quotes.filters.event")}
          </span>

          <select
            name="quote-event-filter"
            className="select select-bordered w-full"
            value={eventId}
            onChange={(event) => onEventChange(event.target.value)}
          >
            <option value="ALL">
              {t("quotes.filters.allEvents")}
            </option>

            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btn btn-outline gap-2"
          onClick={onReset}
        >
          <RotateCcw size={16} />
          {t("quotes.filters.reset")}
        </button>
      </div>
    </section>
  );
}
