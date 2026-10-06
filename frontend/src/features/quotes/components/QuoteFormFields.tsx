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
  label: string;
}[] = [
  { value: "DRAFT", label: "Entwurf" },
  { value: "SENT", label: "Gesendet" },
  { value: "ACCEPTED", label: "Angenommen" },
  { value: "REJECTED", label: "Abgelehnt" },
  { value: "EXPIRED", label: "Abgelaufen" },
  { value: "CANCELLED", label: "Storniert" },
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
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="form-control">
        <span className="label-text mb-2 font-medium">
          Angebotsnummer
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
          placeholder="z. B. ANG-2026-001"
        />
      </label>

      <label className="form-control">
        <span className="label-text mb-2 font-medium">
          Status
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
              {status.label}
            </option>
          ))}
        </select>
      </label>

      <label className="form-control">
        <span className="label-text mb-2 font-medium">
          Kunde
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
          <option value="">Kunde auswählen</option>

          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.customerNo} – {getCustomerName(customer)}
            </option>
          ))}
        </select>
      </label>

      <label className="form-control">
        <span className="label-text mb-2 font-medium">
          Event
        </span>

        <select
          className="select select-bordered w-full"
          value={formData.eventId}
          disabled={loading}
          onChange={(event) =>
            onChange("eventId", event.target.value)
          }
        >
          <option value="">Kein Event</option>

          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.eventNo} – {event.name}
            </option>
          ))}
        </select>
      </label>

      <label className="form-control">
        <span className="label-text mb-2 font-medium">
          Gültig bis
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
          Gesamtrabatt %
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
          MwSt. %
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
          Notizen
        </span>

        <textarea
          className="textarea textarea-bordered min-h-28 w-full"
          maxLength={1000}
          disabled={loading}
          value={formData.notes}
          onChange={(event) =>
            onChange("notes", event.target.value)
          }
          placeholder="Optionale Notizen zum Angebot"
        />
      </label>
    </div>
  );
}
