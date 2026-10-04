import { StatusChip } from "../atoms/StatusChip";

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

function trackingLabel(value: ProductTableItem["trackingType"]) {
  return value === "SERIALIZED" ? "Einzelgerät" : "Menge";
}

function usageLabel(value: ProductTableItem["usageType"]) {
  if (value === "RENTAL") return "Vermietung";
  if (value === "SALE") return "Verkauf";

  return "Beides";
}

export function ProductTable({
  products,
  onView,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-box border border-base-300 bg-base-100 p-8 text-center text-base-content/60">
        Keine Produkte gefunden.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table className="table">
        <thead>
          <tr>
            <th>Produkt</th>
            <th>Produktnr.</th>
            <th>Kategorie</th>
            <th>Tracking</th>
            <th>Verwendung</th>
            <th>Geräte</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Aktionen</span>
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

              <td>{trackingLabel(product.trackingType)}</td>

              <td>{usageLabel(product.usageType)}</td>

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
                    Anzeigen
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
