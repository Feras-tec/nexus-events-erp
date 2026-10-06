import { useState, type FormEvent } from "react";

import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Select } from "../atoms/Select";
import type {
  CustomerFormData,
  CustomerFormErrors,
} from "../../features/customers/types/customer-form.types";
import { validateCustomerForm } from "../../features/customers/utils/customer-form-validation";

export type {
  CustomerFormData,
} from "../../features/customers/types/customer-form.types";

type CustomerFormProps = {
  initialValues?: Partial<CustomerFormData>;
  loading?: boolean;
  mode?: "create" | "edit";
  onSubmit: (data: CustomerFormData) => void;
};

const defaultValues: CustomerFormData = {
  customerNo: "",
  type: "COMPANY",
  companyName: "",
  firstName: "",
  lastName: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  vatId: "",
  discount: "0",
};

export function CustomerForm({
  initialValues,
  loading = false,
  mode = "create",
  onSubmit,
}: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    ...defaultValues,
    ...initialValues,
  });

  const [errors, setErrors] =
    useState<CustomerFormErrors>({});

  function updateField<K extends keyof CustomerFormData>(
    field: K,
    value: CustomerFormData[K],
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateCustomerForm(formData);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit(formData);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-box border border-base-300 bg-base-100 p-6"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Input
          label="Kundennr."
          value={formData.customerNo}
          disabled={mode === "edit"}
          error={errors.customerNo}
          onChange={(event) =>
            updateField("customerNo", event.target.value)
          }
        />

        <Select
          label="Kundentyp"
          value={formData.type}
          options={[
            {
              value: "COMPANY",
              label: "Unternehmen",
            },
            {
              value: "PRIVATE",
              label: "Privatkunde",
            },
          ]}
          onChange={(event) =>
            updateField(
              "type",
              event.target.value as CustomerFormData["type"],
            )
          }
        />

        {formData.type === "COMPANY" && (
          <Input
            label="Firmenname"
            value={formData.companyName}
            error={errors.companyName}
            onChange={(event) =>
              updateField("companyName", event.target.value)
            }
          />
        )}

        {formData.type === "PRIVATE" && (
          <>
            <Input
              label="Vorname"
              value={formData.firstName}
              error={errors.firstName}
              onChange={(event) =>
                updateField("firstName", event.target.value)
              }
            />

            <Input
              label="Nachname"
              value={formData.lastName}
              error={errors.lastName}
              onChange={(event) =>
                updateField("lastName", event.target.value)
              }
            />
          </>
        )}

        <Input
          label="Ansprechpartner"
          value={formData.contactName}
          onChange={(event) =>
            updateField("contactName", event.target.value)
          }
        />

        <Input
          label="E-Mail"
          type="email"
          value={formData.email}
          onChange={(event) =>
            updateField("email", event.target.value)
          }
        />

        <Input
          label="Telefon"
          value={formData.phone}
          onChange={(event) =>
            updateField("phone", event.target.value)
          }
        />

        <Input
          label="Adresse"
          value={formData.address}
          onChange={(event) =>
            updateField("address", event.target.value)
          }
        />

        <Input
          label="USt-IdNr."
          value={formData.vatId}
          onChange={(event) =>
            updateField("vatId", event.target.value)
          }
        />

        <Input
          label="Rabatt (%)"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={formData.discount}
          error={errors.discount}
          onChange={(event) =>
            updateField("discount", event.target.value)
          }
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              Speichern...
            </>
          ) : (
            "Speichern"
          )}
        </Button>
      </div>
    </form>
  );
}
