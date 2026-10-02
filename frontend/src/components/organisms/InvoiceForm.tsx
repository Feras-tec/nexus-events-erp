import { useState, type FormEvent } from "react";

import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Select } from "../atoms/Select";

type CustomerOption = {
  id: string;
  customerNo: string;
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

type EventOption = {
  id: string;
  eventNo: string;
  name: string;
};

type QuoteOption = {
  id: string;
  quoteNo: string;
};

type ProductOption = {
  id: string;
  productNo: string;
  name: string;
};

type InvoiceItem = {
  type: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  productId?: string;
};

export type InvoiceFormData = {
  invoiceNo: string;
  status: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  customerId: string;
  eventId?: string;
  quoteId?: string;
  tax: number;
  discount: number;
  items: InvoiceItem[];
};

type InvoiceFormProps = {
  customers: CustomerOption[];
  events: EventOption[];
  quotes: QuoteOption[];
  products: ProductOption[];
  loading?: boolean;
  onSubmit: (data: InvoiceFormData) => void;
};

const itemTypes = [
  "EQUIPMENT",
  "SERVICE",
  "TRANSPORT",
  "PERSONNEL",
  "OTHER",
];

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
  onSubmit,
}: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceFormData>({
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
  });

  function updateField<K extends keyof InvoiceFormData>(
    field: K,
    value: InvoiceFormData[K],
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateItem(
    index: number,
    field: keyof InvoiceItem,
    value: string | number,
  ) {
    setFormData((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item,
      ),
    }));
  }

  function addItem() {
    setFormData((current) => ({
      ...current,
      items: [...current.items, { ...emptyItem }],
    }));
  }

  function removeItem(index: number) {
    setFormData((current) => ({
      ...current,
      items: current.items.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
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

  const productOptions = products.map((product) => ({
    value: product.id,
    label: `${product.productNo} – ${product.name}`,
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
              updateField("status", event.target.value)
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

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Rechnungspositionen
          </h2>

          <Button type="button" variant="ghost" onClick={addItem}>
            + Position
          </Button>
        </div>

        {formData.items.map((item, index) => (
          <div
            key={index}
            className="rounded-box border border-base-300 bg-base-100 p-5"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Select
                label="Typ"
                value={item.type}
                options={itemTypes.map((type) => ({
                  value: type,
                  label: type,
                }))}
                onChange={(event) =>
                  updateItem(index, "type", event.target.value)
                }
              />

              <Select
                label="Produkt"
                value={item.productId ?? ""}
                options={productOptions}
                placeholder="Kein Produkt"
                onChange={(event) =>
                  updateItem(
                    index,
                    "productId",
                    event.target.value,
                  )
                }
              />

              <Input
                label="Beschreibung"
                value={item.description}
                required
                maxLength={500}
                onChange={(event) =>
                  updateItem(
                    index,
                    "description",
                    event.target.value,
                  )
                }
              />

              <Input
                type="number"
                label="Menge"
                min={0.01}
                step="0.01"
                value={item.quantity}
                required
                onChange={(event) =>
                  updateItem(
                    index,
                    "quantity",
                    Number(event.target.value),
                  )
                }
              />

              <Input
                type="number"
                label="Einzelpreis"
                min={0}
                step="0.01"
                value={item.unitPrice}
                required
                onChange={(event) =>
                  updateItem(
                    index,
                    "unitPrice",
                    Number(event.target.value),
                  )
                }
              />

              <Input
                type="number"
                label="Rabatt %"
                min={0}
                max={100}
                value={item.discount}
                onChange={(event) =>
                  updateItem(
                    index,
                    "discount",
                    Number(event.target.value),
                  )
                }
              />
            </div>

            {formData.items.length > 1 && (
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="error"
                  onClick={() => removeItem(index)}
                >
                  Position entfernen
                </Button>
              </div>
            )}
          </div>
        ))}
      </section>

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
          Rechnung speichern
        </Button>
      </div>
    </form>
  );
}
