import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../components/atoms/Button";
import { useEquipmentTransfer } from "../hooks/useEquipmentTransfer";
import { useEquipmentWarehouses } from "../hooks/useEquipmentWarehouses";
import type { EquipmentDetail } from "../types/equipment.types";

type EquipmentTransferProps = {
  equipmentId: string;
  equipment: EquipmentDetail;
};

export function EquipmentTransfer({
  equipmentId,
  equipment,
}: EquipmentTransferProps) {
  const { t } = useTranslation();
  const [transferWarehouseId, setTransferWarehouseId] = useState("");

  const {
    data: warehouses = [],
    isLoading: warehousesLoading,
    isError: warehousesError,
  } = useEquipmentWarehouses();

  const { transferWarehouseMutation } = useEquipmentTransfer({
    equipmentId,
    equipment,
  });

  if (equipment.status !== "AVAILABLE") {
    return null;
  }

  return (
    <section className="mb-6 rounded-box border border-base-300 bg-base-100 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{t("equipment.transfer.title")}</h2>

        <p className="text-sm text-base-content/60">
          {t("equipment.transfer.description", { warehouse: equipment.warehouse.name })}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="form-control w-full sm:max-w-md">
          <span className="label-text mb-2">{t("equipment.transfer.destination")}</span>

          <select
            className="select select-bordered w-full"
            value={transferWarehouseId}
            onChange={(event) =>
              setTransferWarehouseId(event.target.value)
            }
            disabled={
              warehousesLoading || transferWarehouseMutation.isPending
            }
          >
            <option value="">
              {warehousesLoading
                ? t("equipment.transfer.loadingWarehouses")
                : t("equipment.transfer.selectWarehouse")}
            </option>

            {warehouses
              .filter(
                (warehouse) => warehouse.id !== equipment.warehouseId,
              )
              .map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
          </select>
        </label>

        <Button
          type="button"
          disabled={
            !transferWarehouseId ||
            warehousesLoading ||
            transferWarehouseMutation.isPending
          }
          onClick={() =>
            transferWarehouseMutation.mutate(transferWarehouseId, {
              onSuccess: () => setTransferWarehouseId(""),
            })
          }
        >
          {transferWarehouseMutation.isPending
            ? t("equipment.transfer.transferring")
            : t("equipment.transfer.submit")}
        </Button>
      </div>

      {warehousesError && (
        <div role="alert" className="alert alert-error mt-4">
          {t("equipment.transfer.warehousesError")}
        </div>
      )}

      {transferWarehouseMutation.isError && (
        <div role="alert" className="alert alert-error mt-4">
          {transferWarehouseMutation.error instanceof Error
            ? transferWarehouseMutation.error.message
            : t("equipment.transfer.transferError")}
        </div>
      )}

      {transferWarehouseMutation.isSuccess && (
        <div role="alert" className="alert alert-success mt-4">
          {t("equipment.transfer.success")}
        </div>
      )}
    </section>
  );
}
