import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

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
  submitLabel,
  onSubmit,
}: InvoiceFormProps) {
  const { t } = useTranslation();
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
            label={t("invoices.form.invoiceNo")}
            value={formData.invoiceNo}
            required
            maxLength={50}
            onChange={(event) =>
              updateField("invoiceNo", event.target.value)
            }
          />

          <Select
            label={t("invoices.table.status")}
            value={formData.status}
            options={invoiceStatuses.map((status) => ({
              value: status,
              label: t(`status.${status}`),
            }))}
            onChange={(event) =>
              updateField("status", event.target.value as InvoiceStatus)
            }
          />

          <Select
            label={t("invoices.table.customer")}
            value={formData.customerId}
            options={customerOptions}
            placeholder={t("invoices.form.selectCustomer")}
            required
            onChange={(event) =>
              updateField("customerId", event.target.value)
            }
          />

          <Select
            label={t("invoices.table.event")}
            value={formData.eventId ?? ""}
            options={eventOptions}
            placeholder={t("invoices.form.noEvent")}
            onChange={(event) =>
              updateField("eventId", event.target.value)
            }
          />

          <Select
            label={t("invoices.detail.quote")}
            value={formData.quoteId ?? ""}
            options={quoteOptions}
            placeholder={t("invoices.form.noQuote")}
            onChange={(event) =>
              updateField("quoteId", event.target.value)
            }
          />

          <Input
            type="date"
            label={t("invoices.table.issueDate")}
            value={formData.issueDate}
            onChange={(event) =>
              updateField("issueDate", event.target.value)
            }
          />

          <Input
            type="date"
            label={t("invoices.form.dueDate")}
            value={formData.dueDate}
            min={formData.issueDate}
            onChange={(event) =>
              updateField("dueDate", event.target.value)
            }
          />

          <Input
            type="number"
            label={t("invoices.form.taxPercent")}
            min={0}
            max={100}
            value={formData.tax}
            onChange={(event) =>
              updateField("tax", Number(event.target.value))
            }
          />

          <Input
            type="number"
            label={t("invoices.form.discountPercent")}
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
          {t("invoices.detail.notes")}
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
          {submitLabel ?? t("invoices.form.saveInvoice")}
        </Button>
      </div>
    </form>
  );
}
