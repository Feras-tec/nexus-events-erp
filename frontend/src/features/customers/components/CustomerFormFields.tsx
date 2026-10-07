import { useTranslation } from "react-i18next";

import { Input } from "../../../components/atoms/Input";
import { Select } from "../../../components/atoms/Select";
import type {
  CustomerFormData,
  CustomerFormErrors,
} from "../types/customer-form.types";

type CustomerFormFieldsProps = {
  values: CustomerFormData;
  errors: CustomerFormErrors;
  mode: "create" | "edit";
  onUpdate: <K extends keyof CustomerFormData>(
    field: K,
    value: CustomerFormData[K],
  ) => void;
};

export function CustomerFormFields({
  values,
  errors,
  mode,
  onUpdate,
}: CustomerFormFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Input
        label={t("customers.form.customerNo")}
        value={values.customerNo}
        disabled={mode === "edit"}
        error={errors.customerNo}
        onChange={(event) =>
          onUpdate("customerNo", event.target.value)
        }
      />

      <Select
        label={t("customers.form.type")}
        value={values.type}
        options={[
          {
            value: "COMPANY",
            label: t("customers.types.COMPANY"),
          },
          {
            value: "PRIVATE",
            label: t("customers.types.PRIVATE"),
          },
        ]}
        onChange={(event) =>
          onUpdate(
            "type",
            event.target.value as CustomerFormData["type"],
          )
        }
      />

      {values.type === "COMPANY" && (
        <Input
          label={t("customers.form.companyName")}
          value={values.companyName}
          error={errors.companyName}
          onChange={(event) =>
            onUpdate("companyName", event.target.value)
          }
        />
      )}

      {values.type === "PRIVATE" && (
        <>
          <Input
            label={t("customers.form.firstName")}
            value={values.firstName}
            error={errors.firstName}
            onChange={(event) =>
              onUpdate("firstName", event.target.value)
            }
          />

          <Input
            label={t("customers.form.lastName")}
            value={values.lastName}
            error={errors.lastName}
            onChange={(event) =>
              onUpdate("lastName", event.target.value)
            }
          />
        </>
      )}

      <Input
        label={t("customers.form.contactName")}
        value={values.contactName}
        onChange={(event) =>
          onUpdate("contactName", event.target.value)
        }
      />

      <Input
        label={t("customers.form.email")}
        type="email"
        value={values.email}
        onChange={(event) =>
          onUpdate("email", event.target.value)
        }
      />

      <Input
        label={t("customers.form.phone")}
        value={values.phone}
        onChange={(event) =>
          onUpdate("phone", event.target.value)
        }
      />

      <Input
        label={t("customers.form.address")}
        value={values.address}
        onChange={(event) =>
          onUpdate("address", event.target.value)
        }
      />

      <Input
        label={t("customers.form.vatId")}
        value={values.vatId}
        onChange={(event) =>
          onUpdate("vatId", event.target.value)
        }
      />

      <Input
        label={t("customers.form.discount")}
        type="number"
        min="0"
        max="100"
        step="0.01"
        value={values.discount}
        error={errors.discount}
        onChange={(event) =>
          onUpdate("discount", event.target.value)
        }
      />
    </div>
  );
}
