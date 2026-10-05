import type { EquipmentDetail } from "../types/equipment.types";

type EquipmentProductWarehouseProps = {
  equipment: EquipmentDetail;
};

export function EquipmentProductWarehouse({
  equipment,
}: EquipmentProductWarehouseProps) {
  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-6">
      <h2 className="mb-5 text-lg font-semibold">Produkt & Lager</h2>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-base-content/60">Produktnummer</dt>
          <dd className="font-medium">{equipment.product.productNo}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">Produkt</dt>
          <dd>{equipment.product.name}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">Marke</dt>
          <dd>{equipment.product.brand ?? "—"}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">Modell</dt>
          <dd>{equipment.product.model ?? "—"}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">Kategorie</dt>
          <dd>{equipment.product.category ?? "—"}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">Lager</dt>
          <dd>{equipment.warehouse.name}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">Niederlassung</dt>
          <dd>{equipment.warehouse.branch.name}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">Lageradresse</dt>
          <dd>{equipment.warehouse.address ?? "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
