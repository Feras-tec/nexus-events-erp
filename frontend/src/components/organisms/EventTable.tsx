import { useTranslation } from "react-i18next";
import { StatusChip } from "../atoms/StatusChip";

export type EventItem = {
  id: string;
  eventNo: string;
  name: string;
  type?: string | null;
  location?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  description?: string | null;
  customerId: string;

  customer: {
    id: string;
    customerNo: string;
    companyName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
};

type EventTableProps = {
  events: EventItem[];
  onView?: (eventId: string) => void;
};

function getCustomerName(customer: EventItem["customer"]) {
  if (customer.companyName) {
    return customer.companyName;
  }

  const fullName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ");

  return fullName || "—";
}

export function EventTable({
  events,
  onView,
}: EventTableProps) {
  const { t, i18n } = useTranslation();

  function formatDate(date: string) {
    return new Intl.DateTimeFormat(i18n.language, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  }

  if (events.length === 0) {
    return (
      <div className="rounded-box border border-base-300 bg-base-100 p-8 text-center">
        <p className="text-base-content/60">
          {t("events.noEvents")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table className="table">
        <thead>
          <tr>
            <th>{t("events.table.event")}</th>
            <th>{t("events.table.eventNo")}</th>
            <th>{t("events.table.customer")}</th>
            <th>{t("events.table.period")}</th>
            <th>{t("events.table.location")}</th>
            <th>{t("events.table.status")}</th>
            <th>
              <span className="sr-only">
                {t("common.actions")}
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>
                <div className="font-medium">
                  {event.name}
                </div>

                {event.type && (
                  <div className="text-xs text-base-content/60">
                    {event.type}
                  </div>
                )}
              </td>

              <td>{event.eventNo}</td>

              <td>
                <div>{getCustomerName(event.customer)}</div>
                <div className="text-xs text-base-content/60">
                  {event.customer.customerNo}
                </div>
              </td>

              <td>
                <div>{formatDate(event.startDate)}</div>
                <div className="text-xs text-base-content/60">
                  {t("events.table.until")}{" "}
                  {formatDate(event.endDate)}
                </div>
              </td>

              <td>{event.location ?? "—"}</td>

              <td>
                <StatusChip status={event.status} />
              </td>

              <td className="text-right">
                {onView && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onView(event.id)}
                  >
                    {t("common.view")}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
