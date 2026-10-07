import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

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
  mode?: "create" | "edit";
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
  mode = "create",
  onSubmit,
}: EventFormProps) {
  const { t } = useTranslation();

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
        : [
            customer.firstName,
            customer.lastName,
          ]
            .filter(Boolean)
            .join(" ");

    return {
      value: customer.id,
      label: `${customer.customerNo} – ${
        name || t("events.form.noName")
      }`,
    };
  });

  const statusOptions = eventStatuses.map((status) => ({
    value: status,
    label: t(`status.${status}`, {
      defaultValue: status.replaceAll("_", " "),
    }),
  }));

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-box border border-base-300 bg-base-100 p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={t("events.form.eventNo")}
          value={formData.eventNo}
          minLength={2}
          maxLength={30}
          required
          disabled={mode === "edit"}
          onChange={(event) =>
            updateField("eventNo", event.target.value)
          }
        />

        <Input
          label={t("events.form.name")}
          value={formData.name}
          minLength={2}
          maxLength={150}
          required
          onChange={(event) =>
            updateField("name", event.target.value)
          }
        />

        <Select
          label={t("events.form.customer")}
          value={formData.customerId}
          options={customerOptions}
          placeholder={t("events.form.selectCustomer")}
          required
          disabled={mode === "edit"}
          onChange={(event) =>
            updateField("customerId", event.target.value)
          }
        />

        <Select
          label={t("events.form.status")}
          value={formData.status}
          options={statusOptions}
          onChange={(event) =>
            updateField("status", event.target.value)
          }
        />

        <Input
          label={t("events.form.type")}
          value={formData.type}
          maxLength={100}
          onChange={(event) =>
            updateField("type", event.target.value)
          }
        />

        <Input
          label={t("events.form.location")}
          value={formData.location}
          maxLength={255}
          onChange={(event) =>
            updateField("location", event.target.value)
          }
        />

        <Input
          type="datetime-local"
          label={t("events.form.start")}
          value={formData.startDate}
          required
          onChange={(event) =>
            updateField("startDate", event.target.value)
          }
        />

        <Input
          type="datetime-local"
          label={t("events.form.end")}
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
          {t("events.form.description")}
        </label>

        <textarea
          id="event-description"
          className="textarea textarea-bordered w-full"
          rows={4}
          maxLength={1000}
          value={formData.description}
          onChange={(event) =>
            updateField(
              "description",
              event.target.value,
            )
          }
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
