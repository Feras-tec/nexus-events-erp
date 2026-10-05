import { StatusChip } from "../../../components/atoms/StatusChip";
import type {
  EquipmentDetail,
  EquipmentMovement,
} from "../types/equipment.types";
import {
  formatDate,
  formatPrice,
} from "../utils/equipment-formatters";

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
          <h2 className="text-lg font-semibold">Gerätedaten</h2>
          <p className="text-sm text-base-content/60">
            Technische und interne Informationen
          </p>
        </div>

        <StatusChip status={equipment.status} />
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-base-content/60">Asset-Nr.</dt>
          <dd className="font-medium">{equipment.assetNo}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">Seriennummer</dt>
          <dd>{equipment.manufacturerSerial ?? "—"}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">Barcode</dt>
          <dd>{equipment.barcode ?? "—"}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">Standort</dt>
          <dd>{equipment.location ?? "—"}</dd>
        </div>

        {showExpectedReturn && activeReservation && (
          <div>
            <dt className="text-sm text-base-content/60">
              Erwartete Rückgabe
            </dt>
            <dd className="font-medium">
              {new Intl.DateTimeFormat("de-DE", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(activeReservation.endDate))}
            </dd>
          </div>
        )}

        {showCheckout && checkedOutMovement && (
          <>
            <div>
              <dt className="text-sm text-base-content/60">
                Ausgecheckt am
              </dt>
              <dd className="font-medium">
                {new Intl.DateTimeFormat("de-DE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(checkedOutMovement.createdAt))}
              </dd>
            </div>

            {checkedOutMovement.responsibleEmployee && (
              <div>
                <dt className="text-sm text-base-content/60">
                  Verantwortlich
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
          <dt className="text-sm text-base-content/60">Kaufdatum</dt>
          <dd>{formatDate(equipment.purchaseDate)}</dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">Kaufpreis</dt>
          <dd>{formatPrice(equipment.purchasePrice)}</dd>
        </div>
      </dl>
    </section>
  );
}
