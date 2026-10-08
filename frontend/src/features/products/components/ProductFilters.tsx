import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

export type ProductStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
export type ProductTrackingFilter = "ALL" | "SERIALIZED" | "QUANTITY";
export type ProductUsageFilter = "ALL" | "RENTAL" | "SALE" | "BOTH";

type Props = {
  status: ProductStatusFilter;
  tracking: ProductTrackingFilter;
  usage: ProductUsageFilter;
  onStatusChange: (value: ProductStatusFilter) => void;
  onTrackingChange: (value: ProductTrackingFilter) => void;
  onUsageChange: (value: ProductUsageFilter) => void;
  onReset: () => void;
};

export function ProductFilters({
  status,
  tracking,
  usage,
  onStatusChange,
  onTrackingChange,
  onUsageChange,
  onReset,
}: Props) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;

  const labels = language.startsWith("ar")
    ? ["الفلاتر", "الحالة", "نوع التتبع", "الاستخدام", "جميع الحالات", "جميع أنواع التتبع", "جميع الاستخدامات", "إعادة ضبط"]
    : language.startsWith("de")
      ? ["Filter", "Status", "Verfolgungsart", "Verwendung", "Alle Status", "Alle Verfolgungsarten", "Alle Verwendungen", "Zurücksetzen"]
      : ["Filters", "Status", "Tracking type", "Usage", "All statuses", "All tracking types", "All usages", "Reset"];

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-primary" />
        <h2 className="font-semibold">{labels[0]}</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {labels[1]}
          </span>
          <select
            name="product-status-filter"
            className="select select-bordered w-full"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ProductStatusFilter)}
          >
            <option value="ALL">{labels[4]}</option>
            <option value="ACTIVE">{t("status.ACTIVE")}</option>
            <option value="INACTIVE">{t("status.INACTIVE")}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {labels[2]}
          </span>
          <select
            name="product-tracking-filter"
            className="select select-bordered w-full"
            value={tracking}
            onChange={(e) => onTrackingChange(e.target.value as ProductTrackingFilter)}
          >
            <option value="ALL">{labels[5]}</option>
            <option value="SERIALIZED">{t("products.tracking.SERIALIZED")}</option>
            <option value="QUANTITY">{t("products.tracking.QUANTITY")}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {labels[3]}
          </span>
          <select
            name="product-usage-filter"
            className="select select-bordered w-full"
            value={usage}
            onChange={(e) => onUsageChange(e.target.value as ProductUsageFilter)}
          >
            <option value="ALL">{labels[6]}</option>
            <option value="RENTAL">{t("products.usage.RENTAL")}</option>
            <option value="SALE">{t("products.usage.SALE")}</option>
            <option value="BOTH">{t("products.usage.BOTH")}</option>
          </select>
        </label>

        <button
          type="button"
          className="btn btn-outline gap-2"
          onClick={onReset}
        >
          <RotateCcw size={16} />
          {labels[7]}
        </button>
      </div>
    </div>
  );
}
