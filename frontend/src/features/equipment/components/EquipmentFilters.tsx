import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { InventoryItem } from "../hooks/useEquipment";

export const EQUIPMENT_STATUSES = [
  "RECEIVED",
  "AVAILABLE",
  "RESERVED",
  "PICKING",
  "PACKED",
  "IN_TRANSIT",
  "AT_EVENT",
  "RETURNING",
  "INSPECTION",
  "DAMAGED",
  "MAINTENANCE",
  "REPAIRED",
  "LOST",
  "RETIRED",
] as const;

export type EquipmentStatusFilter =
  | "ALL"
  | (typeof EQUIPMENT_STATUSES)[number];

type Props = {
  equipment: InventoryItem[];
  status: EquipmentStatusFilter;
  warehouseId: string;
  onStatusChange: (value: EquipmentStatusFilter) => void;
  onWarehouseChange: (value: string) => void;
  onReset: () => void;
};

export function EquipmentFilters({
  equipment,
  status,
  warehouseId,
  onStatusChange,
  onWarehouseChange,
  onReset,
}: Props) {
  const { t } = useTranslation();

  const warehouses = Array.from(
    new Map(
      equipment.map((item) => [
        item.warehouse.id,
        {
          id: item.warehouse.id,
          name: item.warehouse.name,
          branch: item.warehouse.branch.name,
        },
      ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-primary" />
        <h2 className="font-semibold">
          {t("equipment.filters.title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("equipment.filters.status")}
          </span>

          <select
            name="equipmentStatusFilter"
            className="select select-bordered w-full"
            value={status}
            onChange={(e) =>
              onStatusChange(e.target.value as EquipmentStatusFilter)
            }
          >
            <option value="ALL">
              {t("equipment.filters.allStatuses")}
            </option>

            {EQUIPMENT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {t(`status.${item}`, { defaultValue: item })}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-base-content/70">
            {t("equipment.filters.warehouse")}
          </span>

          <select
            name="equipmentWarehouseFilter"
            className="select select-bordered w-full"
            value={warehouseId}
            onChange={(e) => onWarehouseChange(e.target.value)}
          >
            <option value="ALL">
              {t("equipment.filters.allWarehouses")}
            </option>

            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} — {warehouse.branch}
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
          {t("equipment.filters.reset")}
        </button>
      </div>
    </div>
  );
}
