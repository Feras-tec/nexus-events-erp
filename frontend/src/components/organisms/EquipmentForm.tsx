import { useEffect, useMemo, useState, type FormEvent } from "react";

export type ProductOption = {
  id: string;
  productNo: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  isActive: boolean;
};

export type WarehouseOption = {
  id: string;
  name: string;
  isActive: boolean;
  branch: {
    id: string;
    name: string;
  };
};

export type EquipmentFormValues = {
  assetNo: string;
  manufacturerSerial: string;
  barcode: string;
  status:
    | "RECEIVED"
    | "AVAILABLE"
    | "RESERVED"
    | "PICKING"
    | "PACKED"
    | "IN_TRANSIT"
    | "AT_EVENT"
    | "RETURNING"
    | "INSPECTION"
    | "DAMAGED"
    | "MAINTENANCE"
    | "REPAIRED"
    | "LOST"
    | "RETIRED";
  location: string;
  purchaseDate: string;
  purchasePrice: string;
  notes: string;
  productId: string;
  warehouseId: string;
};

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

  const availableProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.isActive ||
          (mode === "edit" && product.id === values.productId),
      ),
    [products, mode, values.productId],
  );

  const availableWarehouses = useMemo(
    () =>
      warehouses.filter(
        (warehouse) =>
          warehouse.isActive ||
          (mode === "edit" && warehouse.id === values.warehouseId),
      ),
    [warehouses, mode, values.warehouseId],
  );

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
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Asset-Nr.</legend>
          <input
            type="text"
            className="input w-full"
            value={values.assetNo}
            onChange={(event) =>
              updateField("assetNo", event.target.value)
            }
            disabled={mode === "edit" || loading}
            required
            minLength={2}
            maxLength={30}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Status</legend>
          <select
            className="select w-full"
            value={values.status}
            onChange={(event) =>
              updateField(
                "status",
                event.target.value as EquipmentFormValues["status"],
              )
            }
            disabled={loading}
          >
            <option value="RECEIVED">Eingegangen</option>
            <option value="AVAILABLE">Verfügbar</option>
            <option value="RESERVED">Reserviert</option>
            <option value="PICKING">Kommissionierung</option>
            <option value="PACKED">Verpackt</option>
            <option value="IN_TRANSIT">Unterwegs</option>
            <option value="AT_EVENT">Beim Event</option>
            <option value="RETURNING">Rücktransport</option>
            <option value="INSPECTION">Prüfung</option>
            <option value="DAMAGED">Beschädigt</option>
            <option value="MAINTENANCE">Wartung</option>
            <option value="REPAIRED">Repariert</option>
            <option value="LOST">Verloren</option>
            <option value="RETIRED">Ausgemustert</option>
          </select>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Produkt</legend>
          <select
            className="select w-full"
            value={values.productId}
            onChange={(event) =>
              updateField("productId", event.target.value)
            }
            disabled={mode === "edit" || loading}
            required
          >
            <option value="">Produkt auswählen</option>

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
          <legend className="fieldset-legend">Lager</legend>
          <select
            className="select w-full"
            value={values.warehouseId}
            onChange={(event) =>
              updateField("warehouseId", event.target.value)
            }
            disabled={loading}
            required
          >
            <option value="">Lager auswählen</option>

            {availableWarehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} – {warehouse.branch.name}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Seriennummer</legend>
          <input
            type="text"
            className="input w-full"
            value={values.manufacturerSerial}
            onChange={(event) =>
              updateField("manufacturerSerial", event.target.value)
            }
            disabled={loading}
            maxLength={100}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Barcode</legend>
          <input
            type="text"
            className="input w-full"
            value={values.barcode}
            onChange={(event) =>
              updateField("barcode", event.target.value)
            }
            disabled={loading}
            maxLength={100}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Standort</legend>
          <input
            type="text"
            className="input w-full"
            value={values.location}
            onChange={(event) =>
              updateField("location", event.target.value)
            }
            disabled={loading}
            maxLength={150}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Kaufdatum</legend>
          <input
            type="date"
            className="input w-full"
            value={values.purchaseDate}
            onChange={(event) =>
              updateField("purchaseDate", event.target.value)
            }
            disabled={loading}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Kaufpreis</legend>
          <input
            type="number"
            className="input w-full"
            value={values.purchasePrice}
            onChange={(event) =>
              updateField("purchasePrice", event.target.value)
            }
            disabled={loading}
            min="0"
            step="0.01"
            placeholder="0,00"
          />
        </fieldset>

        <fieldset className="fieldset md:col-span-2">
          <legend className="fieldset-legend">Notizen</legend>
          <textarea
            className="textarea min-h-28 w-full"
            value={values.notes}
            onChange={(event) =>
              updateField("notes", event.target.value)
            }
            disabled={loading}
            maxLength={500}
          />
        </fieldset>
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
          {mode === "edit" ? "Änderungen speichern" : "Gerät anlegen"}
        </button>
      </div>
    </form>
  );
}
