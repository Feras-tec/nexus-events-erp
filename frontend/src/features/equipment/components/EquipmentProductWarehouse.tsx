import { useTranslation } from "react-i18next";
import type { EquipmentDetail } from "../types/equipment.types";

type EquipmentProductWarehouseProps = {
  equipment: EquipmentDetail;
};

export function EquipmentProductWarehouse({
  equipment,
}: EquipmentProductWarehouseProps) {
  const { t } = useTranslation();
  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-6">
      <h2 className="mb-5 text-lg font-semibold">{t("equipment.warehouse.title")}</h2>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-base-content/60">{t("products.form.productNo")}</dt>
          <dd className="font-medium">{equipment.product.productNo}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">{t("products.table.product")}</dt>
          <dd>{equipment.product.name}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">{t("products.form.brand")}</dt>
          <dd>{equipment.product.brand ?? "—"}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">{t("products.form.model")}</dt>
          <dd>{equipment.product.model ?? "—"}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">{t("products.form.category")}</dt>
          <dd>{equipment.product.category ?? "—"}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">{t("products.equipment.warehouse")}</dt>
          <dd>{equipment.warehouse.name}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">{t("equipment.warehouse.branch")}</dt>
          <dd>{equipment.warehouse.branch.name}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">{t("equipment.warehouse.address")}</dt>
          <dd>{equipment.warehouse.address ?? "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
