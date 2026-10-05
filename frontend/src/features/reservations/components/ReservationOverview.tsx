import { StatusChip } from "../../../components/atoms/StatusChip";
import type { ReservationDetail } from "../types/reservation.types";
import {
  formatReservationDateTime,
  getReservationCustomerName,
} from "../utils/reservation-formatters";

type ReservationOverviewProps = {
  reservation: ReservationDetail;
};

export function ReservationOverview({
  reservation,
}: ReservationOverviewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-box border border-base-300 bg-base-100 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Reservierungsdaten</h2>

            <p className="text-sm text-base-content/60">
              Zeitraum und aktueller Status
            </p>
          </div>

          <StatusChip status={reservation.status} />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-base-content/60">Von</dt>
            <dd className="font-medium">
              {formatReservationDateTime(reservation.startDate)}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">Bis</dt>
            <dd className="font-medium">
              {formatReservationDateTime(reservation.endDate)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-box border border-base-300 bg-base-100 p-6">
        <h2 className="mb-5 text-lg font-semibold">Event & Kunde</h2>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-base-content/60">Event-Nr.</dt>
            <dd className="font-medium">{reservation.event.eventNo}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">Event</dt>
            <dd>{reservation.event.name}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">Kunde</dt>
            <dd>{getReservationCustomerName(reservation.event.customer)}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">Kundennummer</dt>
            <dd>{reservation.event.customer.customerNo}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">Ort</dt>
            <dd>{reservation.event.location ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2">
        <h2 className="mb-5 text-lg font-semibold">Gerät & Lager</h2>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-sm text-base-content/60">Asset-Nr.</dt>
            <dd className="font-medium">
              {reservation.inventoryItem.assetNo}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">Produkt</dt>
            <dd>{reservation.inventoryItem.product.name}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">Marke / Modell</dt>
            <dd>
              {[
                reservation.inventoryItem.product.brand,
                reservation.inventoryItem.product.model,
              ]
                .filter(Boolean)
                .join(" ") || "—"}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">Seriennummer</dt>
            <dd>{reservation.inventoryItem.manufacturerSerial ?? "—"}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">Lager</dt>
            <dd>{reservation.inventoryItem.warehouse.name}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">Niederlassung</dt>
            <dd>{reservation.inventoryItem.warehouse.branch.name}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">Standort</dt>
            <dd>{reservation.inventoryItem.location ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2">
        <h2 className="mb-3 text-lg font-semibold">Notizen</h2>

        <p className="whitespace-pre-wrap text-base-content/80">
          {reservation.notes || "Keine Notizen vorhanden."}
        </p>
      </section>
    </div>
  );
}
