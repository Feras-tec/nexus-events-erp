import { useEffect, useState, type FormEvent } from "react";

export type ProductFormValues = {
  productNo: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  description: string;
  trackingType: "SERIALIZED" | "QUANTITY";
  usageType: "RENTAL" | "SALE" | "BOTH";
};

type ProductFormProps = {
  mode?: "create" | "edit";
  initialValues?: Partial<ProductFormValues>;
  loading?: boolean;
  onSubmit: (values: ProductFormValues) => void;
};

const emptyValues: ProductFormValues = {
  productNo: "",
  name: "",
  brand: "",
  model: "",
  category: "",
  description: "",
  trackingType: "SERIALIZED",
  usageType: "RENTAL",
};

export function ProductForm({
  mode = "create",
  initialValues,
  loading = false,
  onSubmit,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>({
    ...emptyValues,
    ...initialValues,
  });

  useEffect(() => {
    setValues({
      ...emptyValues,
      ...initialValues,
    });
  }, [initialValues]);

  function updateField<K extends keyof ProductFormValues>(
    field: K,
    value: ProductFormValues[K],
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
          <legend className="fieldset-legend">Produktnummer</legend>
          <input
            type="text"
            className="input w-full"
            value={values.productNo}
            onChange={(event) =>
              updateField("productNo", event.target.value)
            }
            disabled={mode === "edit" || loading}
            required
            minLength={2}
            maxLength={30}
            placeholder="z. B. PRD-0002"
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Produktname</legend>
          <input
            type="text"
            className="input w-full"
            value={values.name}
            onChange={(event) =>
              updateField("name", event.target.value)
            }
            disabled={loading}
            required
            minLength={2}
            maxLength={150}
            placeholder="z. B. Shure SM58"
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Marke</legend>
          <input
            type="text"
            className="input w-full"
            value={values.brand}
            onChange={(event) =>
              updateField("brand", event.target.value)
            }
            disabled={loading}
            maxLength={100}
            placeholder="z. B. Shure"
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Modell</legend>
          <input
            type="text"
            className="input w-full"
            value={values.model}
            onChange={(event) =>
              updateField("model", event.target.value)
            }
            disabled={loading}
            maxLength={100}
            placeholder="z. B. SM58"
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Kategorie</legend>
          <input
            type="text"
            className="input w-full"
            value={values.category}
            onChange={(event) =>
              updateField("category", event.target.value)
            }
            disabled={loading}
            maxLength={100}
            placeholder="z. B. Audio"
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Tracking</legend>
          <select
            className="select w-full"
            value={values.trackingType}
            onChange={(event) =>
              updateField(
                "trackingType",
                event.target.value as ProductFormValues["trackingType"],
              )
            }
            disabled={loading}
          >
            <option value="SERIALIZED">Einzelgerät / Seriennummer</option>
            <option value="QUANTITY">Mengenartikel</option>
          </select>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Verwendung</legend>
          <select
            className="select w-full"
            value={values.usageType}
            onChange={(event) =>
              updateField(
                "usageType",
                event.target.value as ProductFormValues["usageType"],
              )
            }
            disabled={loading}
          >
            <option value="RENTAL">Vermietung</option>
            <option value="SALE">Verkauf</option>
            <option value="BOTH">Vermietung & Verkauf</option>
          </select>
        </fieldset>

        <fieldset className="fieldset md:col-span-2">
          <legend className="fieldset-legend">Beschreibung</legend>
          <textarea
            className="textarea min-h-28 w-full"
            value={values.description}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
            disabled={loading}
            maxLength={1000}
            placeholder="Beschreibung des Produkts..."
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

          {mode === "edit"
            ? "Änderungen speichern"
            : "Produkt anlegen"}
        </button>
      </div>
    </form>
  );
}
