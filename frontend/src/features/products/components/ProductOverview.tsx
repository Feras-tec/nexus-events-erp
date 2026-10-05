import { StatusChip } from "../../../components/atoms/StatusChip";
import type { ProductDetail } from "../types/product.types";
import {
  trackingLabel,
  usageLabel,
} from "../utils/product-formatters";

type ProductOverviewProps = {
  product: ProductDetail;
};

export function ProductOverview({
  product,
}: ProductOverviewProps) {
  return (
    <>
      <section className="rounded-box border border-base-300 bg-base-100 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">
            Produktdaten
          </h2>

          <StatusChip
            status={product.isActive ? "ACTIVE" : "INACTIVE"}
          />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-base-content/60">
              Produktnummer
            </dt>
            <dd className="font-medium">
              {product.productNo}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">
              Kategorie
            </dt>
            <dd>{product.category ?? "—"}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">
              Marke
            </dt>
            <dd>{product.brand ?? "—"}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">
              Modell
            </dt>
            <dd>{product.model ?? "—"}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">
              Tracking
            </dt>
            <dd>{trackingLabel(product.trackingType)}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">
              Verwendung
            </dt>
            <dd>{usageLabel(product.usageType)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-box border border-base-300 bg-base-100 p-6">
        <h2 className="mb-3 text-lg font-semibold">
          Beschreibung
        </h2>

        <p className="whitespace-pre-wrap text-base-content/80">
          {product.description || "Keine Beschreibung vorhanden."}
        </p>
      </section>
    </>
  );
}
