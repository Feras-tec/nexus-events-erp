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
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Input
        label="Kundennr."
        value={values.customerNo}
        disabled={mode === "edit"}
        error={errors.customerNo}
        onChange={(event) =>
          onUpdate("customerNo", event.target.value)
        }
      />

      <Select
        label="Kundentyp"
        value={values.type}
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
          onUpdate(
            "type",
            event.target.value as CustomerFormData["type"],
          )
        }
      />

      {values.type === "COMPANY" && (
        <Input
          label="Firmenname"
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
            label="Vorname"
            value={values.firstName}
            error={errors.firstName}
            onChange={(event) =>
              onUpdate("firstName", event.target.value)
            }
          />

          <Input
            label="Nachname"
            value={values.lastName}
            error={errors.lastName}
            onChange={(event) =>
              onUpdate("lastName", event.target.value)
            }
          />
        </>
      )}

      <Input
        label="Ansprechpartner"
        value={values.contactName}
        onChange={(event) =>
          onUpdate("contactName", event.target.value)
        }
      />

      <Input
        label="E-Mail"
        type="email"
        value={values.email}
        onChange={(event) =>
          onUpdate("email", event.target.value)
        }
      />

      <Input
        label="Telefon"
        value={values.phone}
        onChange={(event) =>
          onUpdate("phone", event.target.value)
        }
      />

      <Input
        label="Adresse"
        value={values.address}
        onChange={(event) =>
          onUpdate("address", event.target.value)
        }
      />

      <Input
        label="USt-IdNr."
        value={values.vatId}
        onChange={(event) =>
          onUpdate("vatId", event.target.value)
        }
      />

      <Input
        label="Rabatt (%)"
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
