import { useTranslation } from "react-i18next";
import type {
  EquipmentFormValues,
  ProductOption,
  WarehouseOption,
} from "../types/equipment-form.types";

type EquipmentSelectionFieldsProps = {
  values: EquipmentFormValues;
  mode: "create" | "edit";
  loading: boolean;
  products: ProductOption[];
  warehouses: WarehouseOption[];
  onUpdate: <K extends keyof EquipmentFormValues>(
    field: K,
    value: EquipmentFormValues[K],
  ) => void;
};

export function EquipmentSelectionFields({
  values,
  mode,
  loading,
  products,
  warehouses,
  onUpdate,
}: EquipmentSelectionFieldsProps) {
  const { t } = useTranslation();
  const availableProducts = products.filter(
    (product) =>
      product.isActive ||
      (mode === "edit" && product.id === values.productId),
  );

  const availableWarehouses = warehouses.filter(
    (warehouse) =>
      warehouse.isActive ||
      (mode === "edit" && warehouse.id === values.warehouseId),
  );

  return (
    <>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          {t("products.table.product")}
        </legend>

        <select
          className="select w-full"
          value={values.productId}
          onChange={(event) =>
            onUpdate("productId", event.target.value)
          }
          disabled={mode === "edit" || loading}
          required
        >
          <option value="">{t("equipment.form.selectProduct")}</option>

          {availableProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.productNo} – {product.name}
              {product.brand ? ` – ${product.brand}` : ""}
              {product.model ? ` ${product.model}` : ""}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          {t("products.equipment.warehouse")}
        </legend>

        <select
          className="select w-full"
          value={values.warehouseId}
          onChange={(event) =>
            onUpdate("warehouseId", event.target.value)
          }
          disabled={loading}
          required
        >
          <option value="">{t("equipment.form.selectWarehouse")}</option>

          {availableWarehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name} – {warehouse.branch.name}
            </option>
          ))}
        </select>
      </fieldset>
    </>
  );
}
