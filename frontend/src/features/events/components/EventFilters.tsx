import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

export const EVENT_STATUSES = [
  "INQUIRY",
  "QUOTED",
  "CONFIRMED",
  "PREPARING",
  "IN_PROGRESS",
  "COMPLETED",
  "INVOICED",
  "CLOSED",
  "CANCELLED",
] as const;

export type EventStatusFilter =
  | "ALL"
  | (typeof EVENT_STATUSES)[number];

export type EventPeriodFilter =
  | "ALL"
  | "UPCOMING"
  | "ONGOING"
  | "PAST";

type EventFiltersProps = {
  status: EventStatusFilter;
  period: EventPeriodFilter;
  onStatusChange: (value: EventStatusFilter) => void;
  onPeriodChange: (value: EventPeriodFilter) => void;
  onReset: () => void;
};

export function EventFilters({
  status,
  period,
  onStatusChange,
  onPeriodChange,
  onReset,
}: EventFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-primary" />
        <h2 className="font-semibold">
          {t("events.filters.title", { defaultValue: "Filters" })}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <label className="form-control block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("events.filters.status", { defaultValue: "Status" })}
          </span>

          <select
            className="select select-bordered w-full"
            value={status}
            onChange={(e) =>
              onStatusChange(e.target.value as EventStatusFilter)
            }
          >
            <option value="ALL">
              {t("events.filters.allStatuses", {
                defaultValue: "All statuses",
              })}
            </option>

            {EVENT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {t(`status.${item}`, { defaultValue: item })}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("events.filters.period", { defaultValue: "Period" })}
          </span>

          <select
            className="select select-bordered w-full"
            value={period}
            onChange={(e) =>
              onPeriodChange(e.target.value as EventPeriodFilter)
            }
          >
            {(["ALL", "UPCOMING", "ONGOING", "PAST"] as const).map(
              (item) => (
                <option key={item} value={item}>
                  {t(`events.filters.periods.${item}`, {
                    defaultValue: item,
                  })}
                </option>
              )
            )}
          </select>
        </label>

        <button
          type="button"
          className="btn btn-outline gap-2"
          onClick={onReset}
        >
          <RotateCcw size={16} />
          {t("events.filters.reset", { defaultValue: "Reset" })}
        </button>
      </div>
    </div>
  );
}
