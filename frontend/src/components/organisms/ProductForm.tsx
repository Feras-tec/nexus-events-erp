import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
          <legend className="fieldset-legend">{t("products.form.productNo")}</legend>
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
            placeholder={t("products.form.productNoPlaceholder")}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t("products.form.name")}</legend>
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
            placeholder={t("products.form.namePlaceholder")}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t("products.form.brand")}</legend>
          <input
            type="text"
            className="input w-full"
            value={values.brand}
            onChange={(event) =>
              updateField("brand", event.target.value)
            }
            disabled={loading}
            maxLength={100}
            placeholder={t("products.form.brandPlaceholder")}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t("products.form.model")}</legend>
          <input
            type="text"
            className="input w-full"
            value={values.model}
            onChange={(event) =>
              updateField("model", event.target.value)
            }
            disabled={loading}
            maxLength={100}
            placeholder={t("products.form.modelPlaceholder")}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t("products.form.category")}</legend>
          <input
            type="text"
            className="input w-full"
            value={values.category}
            onChange={(event) =>
              updateField("category", event.target.value)
            }
            disabled={loading}
            maxLength={100}
            placeholder={t("products.form.categoryPlaceholder")}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t("products.table.tracking")}</legend>
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
            <option value="SERIALIZED">{t("products.form.serialized")}</option>
            <option value="QUANTITY">{t("products.form.quantity")}</option>
          </select>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t("products.table.usage")}</legend>
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
            <option value="RENTAL">{t("products.usage.RENTAL")}</option>
            <option value="SALE">{t("products.usage.SALE")}</option>
            <option value="BOTH">{t("products.form.both")}</option>
          </select>
        </fieldset>

        <fieldset className="fieldset md:col-span-2">
          <legend className="fieldset-legend">{t("products.form.description")}</legend>
          <textarea
            className="textarea min-h-28 w-full"
            value={values.description}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
            disabled={loading}
            maxLength={1000}
            placeholder={t("products.form.descriptionPlaceholder")}
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
            ? t("products.form.save")
            : t("products.form.create")}
        </button>
      </div>
    </form>
  );
}
