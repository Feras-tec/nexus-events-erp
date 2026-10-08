import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  return (
    <>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          {t("products.equipment.assetNo")}
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
          {t("products.equipment.serialNo")}
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
          {t("equipment.form.barcode")}
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
          {t("products.equipment.location")}
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
          {t("equipment.form.purchaseDate")}
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
          {t("equipment.form.purchasePrice")}
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
          {t("equipment.form.notes")}
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
