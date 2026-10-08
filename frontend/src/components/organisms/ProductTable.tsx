import { useTranslation } from "react-i18next";
import { StatusChip } from "../atoms/StatusChip";
import { ProductMobileCards } from "../../features/products/components/ProductMobileCards";

export type ProductTableItem = {
  id: string;
  productNo: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  category?: string | null;
  trackingType: "SERIALIZED" | "QUANTITY";
  usageType: "RENTAL" | "SALE" | "BOTH";
  isActive: boolean;
  inventoryItems?: {
    id: string;
  }[];
};

type ProductTableProps = {
  products: ProductTableItem[];
  onView?: (productId: string) => void;
};

export function ProductTable({
  products,
  onView,
}: ProductTableProps) {
  const { t } = useTranslation();

  if (products.length === 0) {
    return (
      <div className="rounded-box border border-base-300 bg-base-100 p-8 text-center text-base-content/60">
        {t("products.table.empty")}
      </div>
    );
  }

  return (
    <>
      <ProductMobileCards products={products} onView={onView} />
      <div className="hidden overflow-x-auto rounded-box border border-base-300 bg-base-100 md:block">
      <table className="table">
        <thead>
          <tr>
            <th>{t("products.table.product")}</th>
            <th>{t("products.table.productNo")}</th>
            <th>{t("products.table.category")}</th>
            <th>{t("products.table.tracking")}</th>
            <th>{t("products.table.usage")}</th>
            <th>{t("products.table.devices")}</th>
            <th>{t("products.table.status")}</th>
            <th>
              <span className="sr-only">{t("products.table.actions")}</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <div className="font-medium">{product.name}</div>

                {(product.brand || product.model) && (
                  <div className="text-xs text-base-content/60">
                    {[product.brand, product.model]
                      .filter(Boolean)
                      .join(" ")}
                  </div>
                )}
              </td>

              <td>{product.productNo}</td>

              <td>{product.category ?? "—"}</td>

              <td>{t(`products.tracking.${product.trackingType}`)}</td>

              <td>{t(`products.usage.${product.usageType}`)}</td>

              <td>{product.inventoryItems?.length ?? 0}</td>

              <td>
                <StatusChip
                  status={product.isActive ? "ACTIVE" : "INACTIVE"}
                />
              </td>

              <td className="text-right">
                {onView && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onView(product.id)}
                  >
                    {t("products.table.view")}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
