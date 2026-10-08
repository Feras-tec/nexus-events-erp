import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { Customer } from "../../../components/organisms/CustomerTable";
import type { EventItem } from "../../../components/organisms/EventTable";
import type { ProductTableItem } from "../../../components/organisms/ProductTable";
import type {
  QuoteFormData,
  QuoteFormItem,
} from "../types/quote.types";
import { QuoteFormFields } from "./QuoteFormFields";
import { QuoteItems } from "./QuoteItems";
import { QuoteSummary } from "./QuoteSummary";

type QuoteFormProps = {
  customers: Customer[];
  events: EventItem[];
  products: ProductTableItem[];
  loading?: boolean;
  initialData?: QuoteFormData;
  submitLabel?: string;
  onSubmit: (data: QuoteFormData) => void;
};

const initialItem: QuoteFormItem = {
  type: "EQUIPMENT",
  description: "",
  quantity: "1",
  unitPrice: "0",
  discount: "0",
  productId: "",
};

const initialFormData: QuoteFormData = {
  quoteNo: "",
  status: "DRAFT",
  validUntil: "",
  notes: "",
  customerId: "",
  eventId: "",
  tax: "19",
  discount: "0",
  items: [initialItem],
};

export function QuoteForm({
  customers,
  events,
  products,
  loading = false,
  initialData,
  submitLabel,
  onSubmit,
}: QuoteFormProps) {
  const { t } = useTranslation();

  const [formData, setFormData] =
    useState<QuoteFormData>(
      () => initialData ?? initialFormData,
    );

  function handleFieldChange(
    field: keyof QuoteFormData,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleItemsChange(items: QuoteFormItem[]) {
    setFormData((current) => ({
      ...current,
      items,
    }));
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    onSubmit(formData);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-box border border-base-300 bg-base-100 p-5 shadow-sm"
    >
      <QuoteFormFields
        formData={formData}
        customers={customers}
        events={events}
        loading={loading}
        onChange={handleFieldChange}
      />

      <div className="divider" />

      <QuoteItems
        items={formData.items}
        products={products}
        loading={loading}
        onChange={handleItemsChange}
      />

      <div className="divider" />

      <QuoteSummary
        items={formData.items}
        discount={formData.discount}
        tax={formData.tax}
      />

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading && (
            <span className="loading loading-spinner loading-sm" />
          )}

          {submitLabel ?? t("quotes.form.create")}
        </button>
      </div>
    </form>
  );
}
