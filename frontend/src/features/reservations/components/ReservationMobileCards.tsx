import { CalendarDays, Eye, MapPin, Package } from "lucide-react";
import { useTranslation } from "react-i18next";

import { StatusChip } from "../../../components/atoms/StatusChip";
import type { ReservationItem } from "../../../components/organisms/ReservationTable";

type Props = {
  reservations: ReservationItem[];
  onView?: (reservationId: string) => void;
};

export function ReservationMobileCards({
  reservations,
  onView,
}: Props) {
  const { t, i18n } = useTranslation();

  const locale =
    i18n.resolvedLanguage === "ar"
      ? "ar"
      : i18n.resolvedLanguage === "en"
        ? "en-GB"
        : "de-DE";

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-3 md:hidden">
      {reservations.map((reservation) => (
        <article
          key={reservation.id}
          className="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="break-words font-semibold">
                {reservation.event.name}
              </h3>

              <p className="mt-1 text-xs text-base-content/60">
                {reservation.event.eventNo}
              </p>
            </div>

            <div className="shrink-0">
              <StatusChip status={reservation.status} />
            </div>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Package
                size={17}
                className="mt-0.5 shrink-0 text-primary"
              />

              <div className="min-w-0">
                <p className="text-xs text-base-content/60">
                  {t("reservations.table.equipment")}
                </p>

                <p className="break-words font-medium">
                  {reservation.inventoryItem.product.name}
                </p>

                <p className="break-words text-xs text-base-content/60">
                  {reservation.inventoryItem.assetNo}
                  {reservation.inventoryItem.product.model
                    ? ` · ${reservation.inventoryItem.product.model}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays
                size={17}
                className="mt-0.5 shrink-0 text-primary"
              />

              <div className="min-w-0">
                <p className="text-xs text-base-content/60">
                  {t("reservations.table.period")}
                </p>

                <p>{formatDate(reservation.startDate)}</p>

                <p className="text-base-content/60">
                  {t("reservations.table.until")}{" "}
                  {formatDate(reservation.endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin
                size={17}
                className="mt-0.5 shrink-0 text-primary"
              />

              <div className="min-w-0">
                <p className="text-xs text-base-content/60">
                  {t("reservations.table.warehouse")}
                </p>

                <p className="break-words">
                  {reservation.inventoryItem.warehouse.name}
                </p>
              </div>
            </div>
          </div>

          {onView && (
            <button
              type="button"
              className="btn btn-outline btn-sm mt-4 w-full gap-2"
              onClick={() => onView(reservation.id)}
            >
              <Eye size={16} />
              {t("reservations.table.view")}
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
