import { useNavigate } from "@tanstack/react-router";

import { StatusChip } from "../../../components/atoms/StatusChip";
import type { ProductDetail } from "../types/product.types";

type ProductEquipmentListProps = {
  inventoryItems: ProductDetail["inventoryItems"];
};

export function ProductEquipmentList({
  inventoryItems,
}: ProductEquipmentListProps) {
  const navigate = useNavigate();

  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">
          Zugeordnete Geräte
        </h2>

        <p className="text-sm text-base-content/60">
          {inventoryItems.length} Gerät(e)
        </p>
      </div>

      {inventoryItems.length === 0 ? (
        <p className="text-base-content/60">
          Noch keine Geräte diesem Produkt zugeordnet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Asset-Nr.</th>
                <th>Seriennummer</th>
                <th>Lager</th>
                <th>Standort</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {inventoryItems.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium">
                    {item.assetNo}
                  </td>

                  <td>{item.manufacturerSerial ?? "—"}</td>

                  <td>{item.warehouse.name}</td>

                  <td>{item.location ?? "—"}</td>

                  <td>
                    <StatusChip status={item.status} />
                  </td>

                  <td className="text-right">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        navigate({
                          to: "/equipment/$equipmentId",
                          params: {
                            equipmentId: item.id,
                          },
                        });
                      }}
                    >
                      Anzeigen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
