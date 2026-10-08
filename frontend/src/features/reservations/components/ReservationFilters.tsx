import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

export type ReservationStatusFilter =
  | "ALL"
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

type FilterOption = {
  id: string;
  name: string;
};

type ReservationFiltersProps = {
  status: ReservationStatusFilter;
  eventId: string;
  warehouseId: string;
  events: FilterOption[];
  warehouses: FilterOption[];
  onStatusChange: (value: ReservationStatusFilter) => void;
  onEventChange: (value: string) => void;
  onWarehouseChange: (value: string) => void;
  onReset: () => void;
};

export function ReservationFilters({
  status,
  eventId,
  warehouseId,
  events,
  warehouses,
  onStatusChange,
  onEventChange,
  onWarehouseChange,
  onReset,
}: ReservationFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-primary" />
        <h2 className="font-semibold">
          {t("reservations.filters.title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("reservations.filters.status")}
          </span>

          <select
            name="reservation-status-filter"
            className="select select-bordered w-full"
            value={status}
            onChange={(e) =>
              onStatusChange(
                e.target.value as ReservationStatusFilter
              )
            }
          >
            <option value="ALL">
              {t("reservations.filters.allStatuses")}
            </option>

            {(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const).map(
              (value) => (
                <option key={value} value={value}>
                  {t(`status.${value}`)}
                </option>
              )
            )}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("reservations.filters.event")}
          </span>

          <select
            name="reservation-event-filter"
            className="select select-bordered w-full"
            value={eventId}
            onChange={(e) => onEventChange(e.target.value)}
          >
            <option value="ALL">
              {t("reservations.filters.allEvents")}
            </option>

            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("reservations.filters.warehouse")}
          </span>

          <select
            name="reservation-warehouse-filter"
            className="select select-bordered w-full"
            value={warehouseId}
            onChange={(e) => onWarehouseChange(e.target.value)}
          >
            <option value="ALL">
              {t("reservations.filters.allWarehouses")}
            </option>

            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
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
          {t("reservations.filters.reset")}
        </button>
      </div>
    </div>
  );
}
