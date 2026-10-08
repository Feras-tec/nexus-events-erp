import { useTranslation } from "react-i18next";
import { StatusChip } from "../../../components/atoms/StatusChip";
import type { ProductDetail } from "../types/product.types";

type ProductOverviewProps = {
  product: ProductDetail;
};

export function ProductOverview({
  product,
}: ProductOverviewProps) {
  const { t } = useTranslation();

  return (
    <>
      <section className="rounded-box border border-base-300 bg-base-100 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">
            {t("products.overview.title")}
          </h2>

          <StatusChip
            status={product.isActive ? "ACTIVE" : "INACTIVE"}
          />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-base-content/60">
              {t("products.form.productNo")}
            </dt>
            <dd className="font-medium">
              {product.productNo}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">
              {t("products.form.category")}
            </dt>
            <dd>{product.category ?? "—"}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">
              {t("products.form.brand")}
            </dt>
            <dd>{product.brand ?? "—"}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">
              {t("products.form.model")}
            </dt>
            <dd>{product.model ?? "—"}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">
              {t("products.table.tracking")}
            </dt>
            <dd>{t(`products.tracking.${product.trackingType}`)}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">
              {t("products.table.usage")}
            </dt>
            <dd>{t(`products.usage.${product.usageType}`)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-box border border-base-300 bg-base-100 p-6">
        <h2 className="mb-3 text-lg font-semibold">
          {t("products.form.description")}
        </h2>

        <p className="whitespace-pre-wrap text-base-content/80">
          {product.description || t("products.overview.noDescription")}
        </p>
      </section>
    </>
  );
}
