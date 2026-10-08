import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Eye,
} from "lucide-react";

import { StatusChip } from "../atoms/StatusChip";
import { EventMobileCards } from "../../features/events/components/EventMobileCards";

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

  return (
    [customer.firstName, customer.lastName]
      .filter(Boolean)
      .join(" ") || "—"
  );
}

export function EventTable({
  events,
  onView,
}: EventTableProps) {
  const { t, i18n } = useTranslation();

  const isRTL =
    i18n.resolvedLanguage?.startsWith("ar") ?? false;

  function formatDate(date: string) {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat(i18n.language, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parsed);
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-base-300 bg-base-100 px-6 py-14 text-center shadow-sm">
        <CalendarDays
          size={32}
          className="mx-auto mb-4 text-base-content/40"
        />

        <p className="text-sm text-base-content/60">
          {t("events.noEvents")}
        </p>
      </div>
    );
  }

  return (
    <>
      <EventMobileCards events={events} onView={onView} />

      <div className="hidden overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm md:block">
        <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead className="bg-base-200/60">
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
              <tr
                key={event.id}
                className="transition-colors hover:bg-primary/5"
              >
                <td>
                  <div className="min-w-40 space-y-1">
                    <p className="font-semibold text-base-content">
                      {event.name}
                    </p>

                    {event.type && (
                      <p className="text-xs text-base-content/55">
                        {event.type}
                      </p>
                    )}
                  </div>
                </td>

                <td>
                  <span className="font-mono text-xs text-base-content/70">
                    {event.eventNo}
                  </span>
                </td>

                <td>
                  <div className="min-w-32">
                    <p className="font-medium">
                      {getCustomerName(event.customer)}
                    </p>

                    <p className="mt-1 text-xs text-base-content/50">
                      {event.customer.customerNo}
                    </p>
                  </div>
                </td>

                <td>
                  <div className="flex min-w-36 items-start gap-2">
                    <CalendarDays
                      size={15}
                      className="mt-0.5 shrink-0 text-base-content/45"
                    />

                    <div className="space-y-1 text-sm">
                      <p>{formatDate(event.startDate)}</p>

                      <p className="text-xs text-base-content/55">
                        {t("events.table.until")}{" "}
                        {formatDate(event.endDate)}
                      </p>
                    </div>
                  </div>
                </td>

                <td>
                  <div className="flex min-w-28 items-center gap-2">
                    <MapPin
                      size={15}
                      className="shrink-0 text-base-content/45"
                    />

                    <span className="text-sm">
                      {event.location || "—"}
                    </span>
                  </div>
                </td>

                <td>
                  <StatusChip status={event.status} />
                </td>

                <td>
                  {onView && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm gap-2 whitespace-nowrap"
                      onClick={() => onView(event.id)}
                    >
                      <Eye size={15} />

                      <span>{t("common.view")}</span>

                      {isRTL ? (
                        <ArrowUpRight
                          size={14}
                          className="-scale-x-100 opacity-60"
                        />
                      ) : (
                        <ArrowUpRight
                          size={14}
                          className="opacity-60"
                        />
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
