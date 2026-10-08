import { useTranslation } from "react-i18next";
import { StatusChip } from "../../../components/atoms/StatusChip";
import type {
  EquipmentDetail,
  EquipmentMovement,
} from "../types/equipment.types";

type ActiveReservation = NonNullable<EquipmentMovement["reservation"]>;

type EquipmentOverviewProps = {
  equipment: EquipmentDetail;
  activeReservation: ActiveReservation | null;
  checkedOutMovement?: EquipmentMovement;
};

export function EquipmentOverview({
  equipment,
  activeReservation,
  checkedOutMovement,
}: EquipmentOverviewProps) {
  const { t, i18n } = useTranslation();
  const locale =
    i18n.resolvedLanguage === "ar"
      ? "ar"
      : i18n.resolvedLanguage === "en"
        ? "en-GB"
        : "de-DE";

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

  const formatPurchaseDate = (value: string | null | undefined) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
        }).format(date);
  };

  const formatPurchasePrice = (
    value: string | number | null | undefined,
  ) => {
    if (value === null || value === undefined) return "—";
    const amount = Number(value);
    return Number.isFinite(amount)
      ? new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "EUR",
        }).format(amount)
      : "—";
  };

  const showExpectedReturn =
    activeReservation &&
    [
      "RESERVED",
      "PICKING",
      "PACKED",
      "IN_TRANSIT",
      "AT_EVENT",
      "RETURNING",
      "INSPECTION",
    ].includes(equipment.status);

  const showCheckout =
    checkedOutMovement &&
    ["IN_TRANSIT", "AT_EVENT", "RETURNING", "INSPECTION"].includes(
      equipment.status,
    );

  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{t("equipment.overview.title")}</h2>
          <p className="text-sm text-base-content/60">
            {t("equipment.overview.subtitle")}
          </p>
        </div>

        <StatusChip status={equipment.status} />
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-base-content/60">{t("products.equipment.assetNo")}</dt>
          <dd className="font-medium">{equipment.assetNo}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">{t("products.equipment.serialNo")}</dt>
          <dd>{equipment.manufacturerSerial ?? "—"}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">{t("equipment.form.barcode")}</dt>
          <dd>{equipment.barcode ?? "—"}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">{t("products.equipment.location")}</dt>
          <dd>{equipment.location ?? "—"}</dd>
        </div>

        {showExpectedReturn && activeReservation && (
          <div>
            <dt className="text-sm text-base-content/60">
              {t("equipment.overview.expectedReturn")}
            </dt>
            <dd className="font-medium">
              {formatDateTime(activeReservation.endDate)}
            </dd>
          </div>
        )}

        {showCheckout && checkedOutMovement && (
          <>
            <div>
              <dt className="text-sm text-base-content/60">
                {t("equipment.overview.checkedOutAt")}
              </dt>
              <dd className="font-medium">
                {formatDateTime(checkedOutMovement.createdAt)}
              </dd>
            </div>

            {checkedOutMovement.responsibleEmployee && (
              <div>
                <dt className="text-sm text-base-content/60">
                  {t("equipment.overview.responsible")}
                </dt>
                <dd className="font-medium">
                  {checkedOutMovement.responsibleEmployee.firstName}{" "}
                  {checkedOutMovement.responsibleEmployee.lastName}
                </dd>
                <dd className="text-sm text-base-content/60">
                  {checkedOutMovement.responsibleEmployee.employeeNo}
                  {checkedOutMovement.responsibleEmployee.position
                    ? ` · ${checkedOutMovement.responsibleEmployee.position}`
                    : ""}
                </dd>
              </div>
            )}
          </>
        )}

        <div>
          <dt className="text-sm text-base-content/60">{t("equipment.form.purchaseDate")}</dt>
          <dd>{formatPurchaseDate(equipment.purchaseDate)}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">{t("equipment.form.purchasePrice")}</dt>
          <dd>{formatPurchasePrice(equipment.purchasePrice)}</dd>
        </div>
      </dl>
    </section>
  );
}
