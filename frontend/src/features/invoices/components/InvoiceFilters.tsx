import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { InvoiceStatus } from "../types/invoice.types";

export type InvoiceStatusFilter = InvoiceStatus | "ALL";

type FilterOption = {
  id: string;
  name: string;
};

type InvoiceFiltersProps = {
  status: InvoiceStatusFilter;
  customerId: string;
  eventId: string;
  customers: FilterOption[];
  events: FilterOption[];
  onStatusChange: (value: InvoiceStatusFilter) => void;
  onCustomerChange: (value: string) => void;
  onEventChange: (value: string) => void;
  onReset: () => void;
};

const statuses: InvoiceStatus[] = [
  "DRAFT",
  "ISSUED",
  "PAID",
  "OVERDUE",
  "CANCELLED",
];

export function InvoiceFilters({
  status,
  customerId,
  eventId,
  customers,
  events,
  onStatusChange,
  onCustomerChange,
  onEventChange,
  onReset,
}: InvoiceFiltersProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-primary" />
        <h2 className="font-semibold">
          {t("invoices.filters.title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("invoices.filters.status")}
          </span>

          <select
            name="invoice-status-filter"
            className="select select-bordered w-full"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as InvoiceStatusFilter)
            }
          >
            <option value="ALL">
              {t("invoices.filters.allStatuses")}
            </option>

            {statuses.map((value) => (
              <option key={value} value={value}>
                {t(`invoices.statuses.${value}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("invoices.filters.customer")}
          </span>

          <select
            name="invoice-customer-filter"
            className="select select-bordered w-full"
            value={customerId}
            onChange={(event) => onCustomerChange(event.target.value)}
          >
            <option value="ALL">
              {t("invoices.filters.allCustomers")}
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
            {t("invoices.filters.event")}
          </span>

          <select
            name="invoice-event-filter"
            className="select select-bordered w-full"
            value={eventId}
            onChange={(event) => onEventChange(event.target.value)}
          >
            <option value="ALL">
              {t("invoices.filters.allEvents")}
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
          {t("invoices.filters.reset")}
        </button>
      </div>
    </section>
  );
}
