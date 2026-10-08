import { useTranslation } from "react-i18next";
import { StatusChip } from "../atoms/StatusChip";
import { ReservationMobileCards } from "../../features/reservations/components/ReservationMobileCards";

export type ReservationItem = {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  notes?: string | null;
  eventId: string;
  inventoryItemId: string;

  event: {
    id: string;
    eventNo: string;
    name: string;
  };

  inventoryItem: {
    id: string;
    assetNo: string;
    manufacturerSerial?: string | null;

    product: {
      id: string;
      productNo: string;
      name: string;
      brand?: string | null;
      model?: string | null;
    };

    warehouse: {
      id: string;
      name: string;
    };
  };
};

type ReservationTableProps = {
  reservations: ReservationItem[];
  onView?: (reservationId: string) => void;
};

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ReservationTable({
  reservations,
  onView,
}: ReservationTableProps) {
  const { t, i18n } = useTranslation();

  const locale =
    i18n.resolvedLanguage === "ar"
      ? "ar"
      : i18n.resolvedLanguage === "en"
        ? "en-GB"
        : "de-DE";

  if (reservations.length === 0) {
    return (
      <div className="rounded-box border border-base-300 bg-base-100 p-8 text-center">
        <p className="text-base-content/60">
          {t("reservations.table.empty")}
        </p>
      </div>
    );
  }

  return (
    <>
      <ReservationMobileCards
        reservations={reservations}
        onView={onView}
      />

      <div className="hidden overflow-x-auto rounded-box border border-base-300 bg-base-100 md:block">
        <table className="table">
        <thead>
          <tr>
            <th>{t("reservations.table.event")}</th>
            <th>{t("reservations.table.equipment")}</th>
            <th>{t("reservations.table.period")}</th>
            <th>{t("reservations.table.warehouse")}</th>
            <th>{t("reservations.table.status")}</th>
            <th>
              <span className="sr-only">{t("reservations.table.actions")}</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {reservations.map((reservation) => (
            <tr key={reservation.id}>
              <td>
                <div className="font-medium">
                  {reservation.event.name}
                </div>

                <div className="text-xs text-base-content/60">
                  {reservation.event.eventNo}
                </div>
              </td>

              <td>
                <div className="font-medium">
                  {reservation.inventoryItem.product.name}
                </div>

                <div className="text-xs text-base-content/60">
                  {reservation.inventoryItem.assetNo}
                  {reservation.inventoryItem.product.model
                    ? ` · ${reservation.inventoryItem.product.model}`
                    : ""}
                </div>
              </td>

              <td>
                <div>{formatDateTime(reservation.startDate, locale)}</div>

                <div className="text-xs text-base-content/60">
                  {t("reservations.table.until")} {formatDateTime(reservation.endDate, locale)}
                </div>
              </td>

              <td>{reservation.inventoryItem.warehouse.name}</td>

              <td>
                <StatusChip status={reservation.status} />
              </td>

              <td className="text-right">
                {onView && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onView(reservation.id)}
                  >
                    {t("reservations.table.view")}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </>
  );
}
