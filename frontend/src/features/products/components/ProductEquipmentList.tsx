import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { StatusChip } from "../../../components/atoms/StatusChip";
import type { ProductDetail } from "../types/product.types";

type ProductEquipmentListProps = {
  inventoryItems: ProductDetail["inventoryItems"];
};

export function ProductEquipmentList({
  inventoryItems,
}: ProductEquipmentListProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">
          {t("products.equipment.title")}
        </h2>

        <p className="text-sm text-base-content/60">
          {t("products.equipment.count", { count: inventoryItems.length })}
        </p>
      </div>

      {inventoryItems.length === 0 ? (
        <p className="text-base-content/60">
          {t("products.equipment.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t("products.equipment.assetNo")}</th>
                <th>{t("products.equipment.serialNo")}</th>
                <th>{t("products.equipment.warehouse")}</th>
                <th>{t("products.equipment.location")}</th>
                <th>{t("products.table.status")}</th>
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
                      {t("products.table.view")}
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
