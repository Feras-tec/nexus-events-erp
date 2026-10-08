import { CalendarDays, CircleCheck, Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";

type ReservationStatus = {
  status: string;
};

type ReservationStatsProps = {
  reservations: ReservationStatus[];
};

export function ReservationStats({
  reservations,
}: ReservationStatsProps) {
  const { t } = useTranslation();

  const stats = [
    {
      label: t("reservations.stats.total"),
      value: reservations.length,
      icon: CalendarDays,
      color: "text-primary bg-primary/10",
    },
    {
      label: t("reservations.stats.confirmed"),
      value: reservations.filter(
        (reservation) => reservation.status === "CONFIRMED"
      ).length,
      icon: CircleCheck,
      color: "text-success bg-success/10",
    },
    {
      label: t("reservations.stats.pending"),
      value: reservations.filter(
        (reservation) => reservation.status === "PENDING"
      ).length,
      icon: Clock3,
      color: "text-warning bg-warning/10",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-base-content/60">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {stat.value}
                </p>
              </div>

              <div className={`rounded-xl p-3 ${stat.color}`}>
                <Icon size={22} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
