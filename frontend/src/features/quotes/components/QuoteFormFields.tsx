import { useTranslation } from "react-i18next";
import type { Customer } from "../../../components/organisms/CustomerTable";
import type { EventItem } from "../../../components/organisms/EventTable";
import type {
  QuoteFormData,
  QuoteStatus,
} from "../types/quote.types";

type QuoteFormFieldsProps = {
  formData: QuoteFormData;
  customers: Customer[];
  events: EventItem[];
  loading?: boolean;
  onChange: (
    field: keyof QuoteFormData,
    value: string,
  ) => void;
};

const statuses: {
  value: QuoteStatus;
}[] = [
  { value: "DRAFT" },
  { value: "SENT" },
  { value: "ACCEPTED" },
  { value: "REJECTED" },
  { value: "EXPIRED" },
  { value: "CANCELLED" },
];

function getCustomerName(customer: Customer) {
  if (customer.companyName) {
    return customer.companyName;
  }

  return (
    [customer.firstName, customer.lastName]
      .filter(Boolean)
      .join(" ") || customer.customerNo
  );
}

export function QuoteFormFields({
  formData,
  customers,
  events,
  loading = false,
  onChange,
}: QuoteFormFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="form-control">
        <span className="label-text mb-2 font-medium">
          {t("quotes.form.quoteNo")}
        </span>

        <input
          type="text"
          className="input input-bordered w-full"
          maxLength={50}
          required
          disabled={loading}
          value={formData.quoteNo}
          onChange={(event) =>
            onChange("quoteNo", event.target.value)
          }
          placeholder={t("quotes.form.quoteNoPlaceholder")}
        />
      </label>

      <label className="form-control">
        <span className="label-text mb-2 font-medium">
          {t("quotes.form.status")}
        </span>

        <select
          className="select select-bordered w-full"
          value={formData.status}
          disabled={loading}
          onChange={(event) =>
            onChange("status", event.target.value)
          }
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {t(`quotes.statuses.${status.value}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="form-control">
        <span className="label-text mb-2 font-medium">
          {t("quotes.form.customer")}
        </span>

        <select
          className="select select-bordered w-full"
          value={formData.customerId}
          required
          disabled={loading}
          onChange={(event) =>
            onChange("customerId", event.target.value)
          }
        >
          <option value="">{t("quotes.form.selectCustomer")}</option>

          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.customerNo} – {getCustomerName(customer)}
            </option>
          ))}
        </select>
      </label>

      <label className="form-control">
        <span className="label-text mb-2 font-medium">
          {t("quotes.form.event")}
        </span>

        <select
          className="select select-bordered w-full"
          value={formData.eventId}
          disabled={loading}
          onChange={(event) =>
            onChange("eventId", event.target.value)
          }
        >
          <option value="">{t("quotes.form.noEvent")}</option>

          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.eventNo} – {event.name}
            </option>
          ))}
        </select>
      </label>

      <label className="form-control">
        <span className="label-text mb-2 font-medium">
          {t("quotes.form.validUntil")}
        </span>

        <input
          type="date"
          className="input input-bordered w-full"
          disabled={loading}
          value={formData.validUntil}
          onChange={(event) =>
            onChange("validUntil", event.target.value)
          }
        />
      </label>

      <div />

      <label className="form-control">
        <span className="label-text mb-2 font-medium">
          {t("quotes.form.discount")}
        </span>

        <input
          type="number"
          className="input input-bordered w-full"
          min="0"
          max="100"
          step="0.01"
          disabled={loading}
          value={formData.discount}
          onChange={(event) =>
            onChange("discount", event.target.value)
          }
        />
      </label>

      <label className="form-control">
        <span className="label-text mb-2 font-medium">
          {t("quotes.form.tax")}
        </span>

        <input
          type="number"
          className="input input-bordered w-full"
          min="0"
          max="100"
          step="0.01"
          disabled={loading}
          value={formData.tax}
          onChange={(event) =>
            onChange("tax", event.target.value)
          }
        />
      </label>

      <label className="form-control md:col-span-2">
        <span className="label-text mb-2 font-medium">
          {t("quotes.form.notes")}
        </span>

        <textarea
          className="textarea textarea-bordered min-h-28 w-full"
          maxLength={1000}
          disabled={loading}
          value={formData.notes}
          onChange={(event) =>
            onChange("notes", event.target.value)
          }
          placeholder={t("quotes.form.notesPlaceholder")}
        />
      </label>
    </div>
  );
}
