import { useTranslation } from "react-i18next";
import { Barcode, Eye, MapPin, Warehouse } from "lucide-react";

import { StatusChip } from "../../../components/atoms/StatusChip";
import type { InventoryItem } from "../hooks/useEquipment";

type Props = {
  equipment: InventoryItem[];
  onView?: (equipmentId: string) => void;
};

export function EquipmentMobileCards({ equipment, onView }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 md:hidden">
      {equipment.map((item) => (
        <article
          key={item.id}
          className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="break-words font-semibold">
                {item.product.name}
              </h3>

              <p className="mt-1 text-xs text-base-content/60">
                {item.assetNo}
              </p>

              {(item.product.brand || item.product.model) && (
                <p className="mt-1 text-xs text-base-content/60">
                  {[item.product.brand, item.product.model]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              )}
            </div>

            <StatusChip status={item.status} />
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Barcode
                size={16}
                className="mt-0.5 shrink-0 text-base-content/50"
              />
              <span className="break-all">
                {item.manufacturerSerial || "—"}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <Warehouse
                size={16}
                className="mt-0.5 shrink-0 text-base-content/50"
              />
              <span className="break-words">
                {item.warehouse.name}
                <span className="block text-xs text-base-content/60">
                  {item.warehouse.branch.name}
                </span>
              </span>
            </div>

            <div className="flex items-start gap-2">
              <MapPin
                size={16}
                className="mt-0.5 shrink-0 text-base-content/50"
              />
              <span className="break-words">
                {item.location || "—"}
              </span>
            </div>
          </div>

          {onView && (
            <button
              type="button"
              className="btn btn-outline btn-primary mt-4 w-full gap-2"
              onClick={() => onView(item.id)}
            >
              <Eye size={16} />
              {t("products.table.view")}
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
