import { useTranslation } from "react-i18next";
import { StatusChip } from "../../../components/atoms/StatusChip";
import type { ReservationDetail } from "../types/reservation.types";
import { getReservationCustomerName } from "../utils/reservation-formatters";

type ReservationOverviewProps = {
  reservation: ReservationDetail;
};

export function ReservationOverview({
  reservation,
}: ReservationOverviewProps) {
  const { t, i18n } = useTranslation();

  const locale =
    i18n.resolvedLanguage === "ar"
      ? "ar"
      : i18n.resolvedLanguage === "en"
        ? "en-GB"
        : "de-DE";

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-box border border-base-300 bg-base-100 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{t("reservations.overview.reservationData")}</h2>

            <p className="text-sm text-base-content/60">
              {t("reservations.overview.periodAndStatus")}
            </p>
          </div>

          <StatusChip status={reservation.status} />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-base-content/60">{t("reservations.overview.from")}</dt>
            <dd className="font-medium">
              {formatDateTime(reservation.startDate)}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">{t("reservations.overview.to")}</dt>
            <dd className="font-medium">
              {formatDateTime(reservation.endDate)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-box border border-base-300 bg-base-100 p-6">
        <h2 className="mb-5 text-lg font-semibold">{t("reservations.overview.eventCustomer")}</h2>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-base-content/60">{t("reservations.overview.eventNo")}</dt>
            <dd className="font-medium">{reservation.event.eventNo}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">{t("reservations.overview.event")}</dt>
            <dd>{reservation.event.name}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">{t("reservations.overview.customer")}</dt>
            <dd>{getReservationCustomerName(reservation.event.customer)}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">{t("reservations.overview.customerNo")}</dt>
            <dd>{reservation.event.customer.customerNo}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">{t("reservations.overview.eventLocation")}</dt>
            <dd>{reservation.event.location ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2">
        <h2 className="mb-5 text-lg font-semibold">{t("reservations.overview.equipmentWarehouse")}</h2>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-sm text-base-content/60">{t("reservations.overview.assetNo")}</dt>
            <dd className="font-medium">
              {reservation.inventoryItem.assetNo}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">{t("reservations.overview.product")}</dt>
            <dd>{reservation.inventoryItem.product.name}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">{t("reservations.overview.brandModel")}</dt>
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
            <dt className="text-sm text-base-content/60">{t("reservations.overview.serialNo")}</dt>
            <dd>{reservation.inventoryItem.manufacturerSerial ?? "—"}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">{t("reservations.overview.warehouse")}</dt>
            <dd>{reservation.inventoryItem.warehouse.name}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">{t("reservations.overview.branch")}</dt>
            <dd>{reservation.inventoryItem.warehouse.branch.name}</dd>
          </div>

          <div>
            <dt className="text-sm text-base-content/60">{t("reservations.overview.location")}</dt>
            <dd>{reservation.inventoryItem.location ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2">
        <h2 className="mb-3 text-lg font-semibold">{t("reservations.overview.notes")}</h2>

        <p className="whitespace-pre-wrap text-base-content/80">
          {reservation.notes || t("reservations.overview.noNotes")}
        </p>
      </section>
    </div>
  );
}
