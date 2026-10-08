import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { EquipmentFormFields } from "../../features/equipment/components/EquipmentFormFields";
import { EquipmentSelectionFields } from "../../features/equipment/components/EquipmentSelectionFields";
import type {
  EquipmentFormValues,
  ProductOption,
  WarehouseOption,
} from "../../features/equipment/types/equipment-form.types";

export type {
  EquipmentFormValues,
  ProductOption,
  WarehouseOption,
} from "../../features/equipment/types/equipment-form.types";

type EquipmentFormProps = {
  mode?: "create" | "edit";
  products: ProductOption[];
  warehouses: WarehouseOption[];
  initialValues?: Partial<EquipmentFormValues>;
  loading?: boolean;
  onSubmit: (values: EquipmentFormValues) => void;
};

const emptyValues: EquipmentFormValues = {
  assetNo: "",
  manufacturerSerial: "",
  barcode: "",
  status: "AVAILABLE",
  location: "",
  purchaseDate: "",
  purchasePrice: "",
  notes: "",
  productId: "",
  warehouseId: "",
};

export function EquipmentForm({
  mode = "create",
  products,
  warehouses,
  initialValues,
  loading = false,
  onSubmit,
}: EquipmentFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<EquipmentFormValues>({
    ...emptyValues,
    ...initialValues,
  });

  useEffect(() => {
    setValues({
      ...emptyValues,
      ...initialValues,
    });
  }, [initialValues]);

  function updateField<K extends keyof EquipmentFormValues>(
    field: K,
    value: EquipmentFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <EquipmentFormFields
          values={values}
          loading={loading}
          onUpdate={updateField}
        />

        <EquipmentSelectionFields
          values={values}
          mode={mode}
          loading={loading}
          products={products}
          warehouses={warehouses}
          onUpdate={updateField}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading && (
            <span className="loading loading-spinner loading-sm" />
          )}
          {mode === "edit" ? t("equipment.form.save") : t("equipment.form.create")}
        </button>
      </div>
    </form>
  );
}
