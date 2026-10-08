import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { EventItem } from "../../../components/organisms/EventTable";
import { StatusChip } from "../../../components/atoms/StatusChip";

type UpcomingEventsProps = {
  events: EventItem[];
  isLoading: boolean;
  isError: boolean;
};

export function UpcomingEvents({
  events,
  isLoading,
  isError,
}: UpcomingEventsProps) {
  const { t, i18n } = useTranslation();

  const now = Date.now();

  const upcomingEvents = events
    .filter((event) => {
      const end = new Date(event.endDate).getTime();

      return (
        Number.isFinite(end) &&
        end >= now &&
        event.status.toUpperCase() !== "CANCELLED"
      );
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() -
        new Date(b.startDate).getTime(),
    )
    .slice(0, 5);

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(i18n.language, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  }

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          {t("dashboard.upcomingEvents")}
        </h2>

        <Link
          to="/events"
          className="btn btn-ghost btn-sm"
        >
          {t("dashboard.viewAll")}
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : isError ? (
        <p className="text-sm text-error">
          {t("dashboard.eventsLoadError")}
        </p>
      ) : upcomingEvents.length === 0 ? (
        <p className="py-8 text-center text-sm text-base-content/60">
          {t("dashboard.noUpcomingEvents")}
        </p>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <Link
              key={event.id}
              to="/events/$eventId"
              params={{ eventId: event.id }}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-base-300 p-3 transition-colors hover:bg-base-200"
            >
              <div className="min-w-0">
                <p className="font-semibold">
                  {event.name}
                </p>

                <p className="mt-1 text-xs text-base-content/60">
                  {event.eventNo} · {formatDate(event.startDate)}
                </p>
              </div>

              <StatusChip status={event.status} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
