import { StatusChip } from "../atoms/StatusChip";

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Ausstehend";

    case "CONFIRMED":
      return "Bestätigt";

    case "CANCELLED":
      return "Storniert";

    case "COMPLETED":
      return "Abgeschlossen";

    default:
      return status;
  }
}

export function ReservationTable({
  reservations,
  onView,
}: ReservationTableProps) {
  if (reservations.length === 0) {
    return (
      <div className="rounded-box border border-base-300 bg-base-100 p-8 text-center">
        <p className="text-base-content/60">
          Keine Reservierungen gefunden.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table className="table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Gerät</th>
            <th>Zeitraum</th>
            <th>Lager</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Aktionen</span>
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
                <div>{formatDateTime(reservation.startDate)}</div>

                <div className="text-xs text-base-content/60">
                  bis {formatDateTime(reservation.endDate)}
                </div>
              </td>

              <td>{reservation.inventoryItem.warehouse.name}</td>

              <td>
                <div className="flex flex-col items-start gap-1">
                  <StatusChip status={reservation.status} />

                  <span className="text-xs text-base-content/60">
                    {getStatusLabel(reservation.status)}
                  </span>
                </div>
              </td>

              <td className="text-right">
                {onView && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onView(reservation.id)}
                  >
                    Anzeigen
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
