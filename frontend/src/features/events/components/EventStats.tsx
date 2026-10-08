import { CalendarDays, Clock3, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { EventItem } from "../../../components/organisms/EventTable";

type EventStatsProps = {
  events: EventItem[];
};

export function EventStats({ events }: EventStatsProps) {
  const { i18n } = useTranslation();

  const language = i18n.resolvedLanguage ?? i18n.language;

  const labels = language.startsWith("ar")
    ? ["جميع الفعاليات", "الفعاليات القادمة", "الفعاليات المكتملة"]
    : language.startsWith("de")
      ? ["Alle Veranstaltungen", "Bevorstehende", "Abgeschlossen"]
      : ["Total Events", "Upcoming Events", "Completed Events"];

  const now = Date.now();

  const upcoming = events.filter((event) => {
    const start = new Date(event.startDate).getTime();

    return (
      Number.isFinite(start) &&
      start > now &&
      !["CANCELLED", "COMPLETED"].includes(
        event.status.toUpperCase()
      )
    );
  }).length;

  const completed = events.filter(
    (event) => event.status.toUpperCase() === "COMPLETED"
  ).length;

  const stats = [
    {
      label: labels[0],
      value: events.length,
      icon: CalendarDays,
      color: "text-primary",
      background: "bg-primary/10",
    },
    {
      label: labels[1],
      value: upcoming,
      icon: Clock3,
      color: "text-info",
      background: "bg-info/10",
    },
    {
      label: labels[2],
      value: completed,
      icon: CheckCircle2,
      color: "text-success",
      background: "bg-success/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <p className="text-sm text-base-content/60">
                  {stat.label}
                </p>

                <p className="text-3xl font-bold tabular-nums">
                  {stat.value}
                </p>
              </div>

              <div className={`rounded-xl p-3 ${stat.background}`}>
                <Icon size={22} className={stat.color} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
