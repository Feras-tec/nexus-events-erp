import { useTranslation } from "react-i18next";
import { Boxes, Eye, Layers3, Package, Tag } from "lucide-react";

import { StatusChip } from "../../../components/atoms/StatusChip";
import type { ProductTableItem } from "../../../components/organisms/ProductTable";

type Props = {
  products: ProductTableItem[];
  onView?: (productId: string) => void;
};

export function ProductMobileCards({ products, onView }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 md:hidden">
      {products.map((product) => (
        <article
          key={product.id}
          className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm transition-colors hover:border-primary/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="break-words font-semibold">
                {product.name}
              </h3>

              <p className="mt-1 text-xs text-base-content/60">
                {product.productNo}
              </p>

              {(product.brand || product.model) && (
                <p className="mt-1 text-xs text-base-content/60">
                  {[product.brand, product.model]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              )}
            </div>

            <StatusChip
              status={product.isActive ? "ACTIVE" : "INACTIVE"}
            />
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Tag size={16} className="shrink-0 text-base-content/50" />
              <span>{product.category || "—"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Layers3 size={16} className="shrink-0 text-base-content/50" />
              <span>
                {t(`products.tracking.${product.trackingType}`)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Package size={16} className="shrink-0 text-base-content/50" />
              <span>
                {t(`products.usage.${product.usageType}`)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Boxes size={16} className="shrink-0 text-base-content/50" />
              <span>
                {t("products.table.devices")}:{" "}
                {product.inventoryItems?.length ?? 0}
              </span>
            </div>
          </div>

          {onView && (
            <button
              type="button"
              className="btn btn-outline btn-primary mt-4 w-full gap-2"
              onClick={() => onView(product.id)}
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
