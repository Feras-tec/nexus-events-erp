import type { EquipmentFormValues } from "../types/equipment-form.types";

type EquipmentFormFieldsProps = {
  values: EquipmentFormValues;
  loading: boolean;
  onUpdate: <K extends keyof EquipmentFormValues>(
    field: K,
    value: EquipmentFormValues[K],
  ) => void;
};

export function EquipmentFormFields({
  values,
  loading,
  onUpdate,
}: EquipmentFormFieldsProps) {
  return (
    <>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          Asset-Nr.
        </legend>

        <input
          type="text"
          className="input w-full"
          value={values.assetNo}
          onChange={(event) =>
            onUpdate("assetNo", event.target.value)
          }
          required
          minLength={2}
          maxLength={30}
          disabled={loading}
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          Seriennummer
        </legend>

        <input
          type="text"
          className="input w-full"
          value={values.manufacturerSerial}
          onChange={(event) =>
            onUpdate(
              "manufacturerSerial",
              event.target.value,
            )
          }
          disabled={loading}
          maxLength={100}
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          Barcode
        </legend>

        <input
          type="text"
          className="input w-full"
          value={values.barcode}
          onChange={(event) =>
            onUpdate("barcode", event.target.value)
          }
          disabled={loading}
          maxLength={100}
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          Standort
        </legend>

        <input
          type="text"
          className="input w-full"
          value={values.location}
          onChange={(event) =>
            onUpdate("location", event.target.value)
          }
          disabled={loading}
          maxLength={150}
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          Kaufdatum
        </legend>

        <input
          type="date"
          className="input w-full"
          value={values.purchaseDate}
          onChange={(event) =>
            onUpdate("purchaseDate", event.target.value)
          }
          disabled={loading}
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          Kaufpreis
        </legend>

        <input
          type="number"
          className="input w-full"
          value={values.purchasePrice}
          onChange={(event) =>
            onUpdate("purchasePrice", event.target.value)
          }
          disabled={loading}
          min="0"
          step="0.01"
          placeholder="0,00"
        />
      </fieldset>

      <fieldset className="fieldset md:col-span-2">
        <legend className="fieldset-legend">
          Notizen
        </legend>

        <textarea
          className="textarea min-h-28 w-full"
          value={values.notes}
          onChange={(event) =>
            onUpdate("notes", event.target.value)
          }
          disabled={loading}
          maxLength={500}
        />
      </fieldset>
    </>
  );
}
