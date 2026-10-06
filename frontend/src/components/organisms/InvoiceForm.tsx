import { useState, type FormEvent } from "react";

import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Select } from "../atoms/Select";
import { InvoiceItems } from "../../features/invoices/components/InvoiceItems";

import type {
  CustomerOption,
  EventOption,
  InvoiceFormData,
  InvoiceItem,
  InvoiceStatus,
  ProductOption,
  QuoteOption,
} from "../../features/invoices/types/invoice.types";

export type { InvoiceFormData } from "../../features/invoices/types/invoice.types";

type InvoiceFormProps = {
  customers: CustomerOption[];
  events: EventOption[];
  quotes: QuoteOption[];
  products: ProductOption[];
  loading?: boolean;
  initialData?: InvoiceFormData;
  submitLabel?: string;
  onSubmit: (data: InvoiceFormData) => void;
};

const invoiceStatuses = [
  "DRAFT",
  "ISSUED",
  "PAID",
  "OVERDUE",
  "CANCELLED",
];

const emptyItem: InvoiceItem = {
  type: "EQUIPMENT",
  description: "",
  quantity: 1,
  unitPrice: 0,
  discount: 0,
};

export function InvoiceForm({
  customers,
  events,
  quotes,
  products,
  loading = false,
  initialData,
  submitLabel = "Rechnung speichern",
  onSubmit,
}: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceFormData>(
    () =>
      initialData ?? {
        invoiceNo: "",
        status: "DRAFT",
        issueDate: "",
        dueDate: "",
        notes: "",
        customerId: "",
        eventId: "",
        quoteId: "",
        tax: 19,
        discount: 0,
        items: [{ ...emptyItem }],
      },
  );

  function updateField<K extends keyof InvoiceFormData>(
    field: K,
    value: InvoiceFormData[K],
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      ...formData,
      eventId: formData.eventId || undefined,
      quoteId: formData.quoteId || undefined,
      items: formData.items.map((item) => ({
        ...item,
        productId: item.productId || undefined,
      })),
    });
  }

  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: `${customer.customerNo} – ${
      customer.companyName ||
      [customer.firstName, customer.lastName]
        .filter(Boolean)
        .join(" ")
    }`,
  }));

  const eventOptions = events.map((event) => ({
    value: event.id,
    label: `${event.eventNo} – ${event.name}`,
  }));

  const quoteOptions = quotes.map((quote) => ({
    value: quote.id,
    label: quote.quoteNo,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-box border border-base-300 bg-base-100 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Rechnungs-Nr."
            value={formData.invoiceNo}
            required
            maxLength={50}
            onChange={(event) =>
              updateField("invoiceNo", event.target.value)
            }
          />

          <Select
            label="Status"
            value={formData.status}
            options={invoiceStatuses.map((status) => ({
              value: status,
              label: status,
            }))}
            onChange={(event) =>
              updateField("status", event.target.value as InvoiceStatus)
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
            label="Event"
            value={formData.eventId ?? ""}
            options={eventOptions}
            placeholder="Kein Event"
            onChange={(event) =>
              updateField("eventId", event.target.value)
            }
          />

          <Select
            label="Angebot"
            value={formData.quoteId ?? ""}
            options={quoteOptions}
            placeholder="Kein Angebot"
            onChange={(event) =>
              updateField("quoteId", event.target.value)
            }
          />

          <Input
            type="date"
            label="Rechnungsdatum"
            value={formData.issueDate}
            onChange={(event) =>
              updateField("issueDate", event.target.value)
            }
          />

          <Input
            type="date"
            label="Fälligkeitsdatum"
            value={formData.dueDate}
            min={formData.issueDate}
            onChange={(event) =>
              updateField("dueDate", event.target.value)
            }
          />

          <Input
            type="number"
            label="Steuer %"
            min={0}
            max={100}
            value={formData.tax}
            onChange={(event) =>
              updateField("tax", Number(event.target.value))
            }
          />

          <Input
            type="number"
            label="Rabatt %"
            min={0}
            max={100}
            value={formData.discount}
            onChange={(event) =>
              updateField("discount", Number(event.target.value))
            }
          />
        </div>
      </section>

      <InvoiceItems
        items={formData.items}
        products={products}
        onAdd={() =>
          setFormData((current) => ({
            ...current,
            items: [...current.items, { ...emptyItem }],
          }))
        }
        onRemove={(index) =>
          setFormData((current) => ({
            ...current,
            items: current.items.filter(
              (_, itemIndex) => itemIndex !== index,
            ),
          }))
        }
        onUpdate={(index, field, value) =>
          setFormData((current) => ({
            ...current,
            items: current.items.map((item, itemIndex) =>
              itemIndex === index
                ? { ...item, [field]: value }
                : item,
            ),
          }))
        }
      />

      <div>
        <label
          htmlFor="invoice-notes"
          className="mb-2 block text-sm font-medium"
        >
          Notizen
        </label>

        <textarea
          id="invoice-notes"
          className="textarea textarea-bordered w-full"
          rows={4}
          maxLength={1000}
          value={formData.notes}
          onChange={(event) =>
            updateField("notes", event.target.value)
          }
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
