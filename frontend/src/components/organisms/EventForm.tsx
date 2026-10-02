import { useState, type FormEvent } from "react";

import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Select } from "../atoms/Select";

type CustomerOption = {
  id: string;
  customerNo: string;
  type: string;
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type EventFormData = {
  eventNo: string;
  name: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
  customerId: string;
};

type EventFormProps = {
  customers: CustomerOption[];
  initialValues?: Partial<EventFormData>;
  loading?: boolean;
  onSubmit: (data: EventFormData) => void;
};

const eventStatuses = [
  "INQUIRY",
  "QUOTED",
  "CONFIRMED",
  "PREPARING",
  "IN_PROGRESS",
  "COMPLETED",
  "INVOICED",
  "CLOSED",
];

const emptyForm: EventFormData = {
  eventNo: "",
  name: "",
  type: "",
  location: "",
  startDate: "",
  endDate: "",
  status: "INQUIRY",
  description: "",
  customerId: "",
};

export function EventForm({
  customers,
  initialValues,
  loading = false,
  onSubmit,
}: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    ...emptyForm,
    ...initialValues,
  });

  function updateField(
    field: keyof EventFormData,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !formData.eventNo ||
      !formData.name ||
      !formData.customerId ||
      !formData.startDate ||
      !formData.endDate
    ) {
      return;
    }

    onSubmit(formData);
  }

  const customerOptions = customers.map((customer) => {
    const name =
      customer.type === "COMPANY"
        ? customer.companyName
        : [customer.firstName, customer.lastName]
            .filter(Boolean)
            .join(" ");

    return {
      value: customer.id,
      label: `${customer.customerNo} – ${name || "Ohne Name"}`,
    };
  });

  const statusOptions = eventStatuses.map((status) => ({
    value: status,
    label: status.replaceAll("_", " "),
  }));

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-box border border-base-300 bg-base-100 p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Event-Nr."
          value={formData.eventNo}
          minLength={2}
          maxLength={30}
          required
          onChange={(event) =>
            updateField("eventNo", event.target.value)
          }
        />

        <Input
          label="Name"
          value={formData.name}
          minLength={2}
          maxLength={150}
          required
          onChange={(event) =>
            updateField("name", event.target.value)
          }
        />

        <Select
          label="Kunde"
          value={formData.customerId}
          options={customerOptions}
          placeholder="Kunde auswählen"
          required
          onChange={(event) =>
            updateField("customerId", event.target.value)
          }
        />

        <Select
          label="Status"
          value={formData.status}
          options={statusOptions}
          onChange={(event) =>
            updateField("status", event.target.value)
          }
        />

        <Input
          label="Typ"
          value={formData.type}
          maxLength={100}
          onChange={(event) =>
            updateField("type", event.target.value)
          }
        />

        <Input
          label="Ort"
          value={formData.location}
          maxLength={255}
          onChange={(event) =>
            updateField("location", event.target.value)
          }
        />

        <Input
          type="datetime-local"
          label="Start"
          value={formData.startDate}
          required
          onChange={(event) =>
            updateField("startDate", event.target.value)
          }
        />

        <Input
          type="datetime-local"
          label="Ende"
          value={formData.endDate}
          min={formData.startDate}
          required
          onChange={(event) =>
            updateField("endDate", event.target.value)
          }
        />
      </div>

      <div>
        <label
          htmlFor="event-description"
          className="mb-2 block text-sm font-medium"
        >
          Beschreibung
        </label>

        <textarea
          id="event-description"
          className="textarea textarea-bordered w-full"
          rows={4}
          maxLength={1000}
          value={formData.description}
          onChange={(event) =>
            updateField("description", event.target.value)
          }
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          Speichern
        </Button>
      </div>
    </form>
  );
}
