import { useTranslation } from "react-i18next";
import { Building2, CalendarDays, Eye, MapPin } from "lucide-react";

import { StatusChip } from "../../../components/atoms/StatusChip";
import type { EventItem } from "../../../components/organisms/EventTable";

type Props = {
  events: EventItem[];
  onView?: (eventId: string) => void;
};

export function EventMobileCards({ events, onView }: Props) {
  const { t, i18n } = useTranslation();

  const formatDate = (value: string) => {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "—"
      : new Intl.DateTimeFormat(i18n.language, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(date);
  };

  return (
    <div className="space-y-3 md:hidden">
      {events.map((event) => {
        const customer =
          event.customer.companyName ||
          [event.customer.firstName, event.customer.lastName]
            .filter(Boolean)
            .join(" ") ||
          "—";

        return (
          <article
            key={event.id}
            className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold break-words">
                  {event.name}
                </h3>
                <p className="mt-1 text-xs text-base-content/60">
                  {event.eventNo}
                </p>
              </div>

              <StatusChip status={event.status} />
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Building2 size={16} className="mt-0.5 shrink-0 text-base-content/50" />
                <span className="break-words">{customer}</span>
              </div>

              <div className="flex items-start gap-2">
                <CalendarDays size={16} className="mt-0.5 shrink-0 text-base-content/50" />
                <span>
                  {formatDate(event.startDate)} – {formatDate(event.endDate)}
                </span>
              </div>

              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-base-content/50" />
                <span className="break-words">{event.location || "—"}</span>
              </div>
            </div>

            {onView && (
              <button
                type="button"
                className="btn btn-outline btn-primary mt-4 w-full gap-2"
                onClick={() => onView(event.id)}
              >
                <Eye size={16} />
                {t("common.view")}
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
