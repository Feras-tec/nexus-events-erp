import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

export type CustomerTypeFilter = "ALL" | "COMPANY" | "PERSON";
export type CustomerStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

type CustomerFiltersProps = {
  type: CustomerTypeFilter;
  status: CustomerStatusFilter;
  onTypeChange: (value: CustomerTypeFilter) => void;
  onStatusChange: (value: CustomerStatusFilter) => void;
  onReset: () => void;
};

export function CustomerFilters({
  type,
  status,
  onTypeChange,
  onStatusChange,
  onReset,
}: CustomerFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-primary" />
        <h2 className="font-semibold">
          {t("customers.filters.title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("customers.filters.type")}
          </span>

          <select
            className="select select-bordered w-full"
            value={type}
            onChange={(e) =>
              onTypeChange(e.target.value as CustomerTypeFilter)
            }
          >
            <option value="ALL">
              {t("customers.filters.allTypes")}
            </option>
            <option value="COMPANY">
              {t("customers.types.COMPANY")}
            </option>
            <option value="PERSON">
              {t("customers.types.PERSON")}
            </option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("customers.filters.status")}
          </span>

          <select
            className="select select-bordered w-full"
            value={status}
            onChange={(e) =>
              onStatusChange(e.target.value as CustomerStatusFilter)
            }
          >
            <option value="ALL">
              {t("customers.filters.allStatuses")}
            </option>
            <option value="ACTIVE">
              {t("status.ACTIVE")}
            </option>
            <option value="INACTIVE">
              {t("status.INACTIVE")}
            </option>
          </select>
        </label>

        <button
          type="button"
          className="btn btn-outline gap-2"
          onClick={onReset}
        >
          <RotateCcw size={16} />
          {t("customers.filters.reset")}
        </button>
      </div>
    </div>
  );
}
