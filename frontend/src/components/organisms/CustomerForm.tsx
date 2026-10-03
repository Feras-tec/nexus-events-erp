import { useState, type FormEvent } from "react";

import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Select } from "../atoms/Select";

export type CustomerFormData = {
  customerNo: string;
  type: "COMPANY" | "PRIVATE";
  companyName: string;
  firstName: string;
  lastName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  vatId: string;
  discount: string;
};

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

  const [errors, setErrors] = useState<
    Partial<Record<keyof CustomerFormData, string>>
  >({});

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

    const nextErrors: Partial<
      Record<keyof CustomerFormData, string>
    > = {};

    if (!formData.customerNo.trim()) {
      nextErrors.customerNo = "Kundennummer ist erforderlich.";
    }

    if (
      formData.type === "COMPANY" &&
      !formData.companyName.trim()
    ) {
      nextErrors.companyName =
        "Firmenname ist für Firmenkunden erforderlich.";
    }

    if (
      formData.type === "PRIVATE" &&
      !formData.firstName.trim()
    ) {
      nextErrors.firstName =
        "Vorname ist für Privatkunden erforderlich.";
    }

    if (
      formData.type === "PRIVATE" &&
      !formData.lastName.trim()
    ) {
      nextErrors.lastName =
        "Nachname ist für Privatkunden erforderlich.";
    }

    const discount = Number(formData.discount);

    if (
      formData.discount.trim() === "" ||
      Number.isNaN(discount) ||
      discount < 0 ||
      discount > 100
    ) {
      nextErrors.discount =
        "Rabatt muss zwischen 0 und 100 liegen.";
    }

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
