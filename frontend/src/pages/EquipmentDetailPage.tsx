import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import {
  EquipmentForm,
  type EquipmentFormValues,
} from "../components/organisms/EquipmentForm";
import type {
} from "../features/equipment/types/equipment.types";
import { DetailLayout } from "../components/templates/DetailLayout";
import { useEquipmentDetail } from "../features/equipment/hooks/useEquipmentDetail";
import { useEquipmentMovements } from "../features/equipment/hooks/useEquipmentMovements";
import { useEquipmentReservations } from "../features/equipment/hooks/useEquipmentReservations";
import { useEquipmentProducts } from "../features/equipment/hooks/useEquipmentProducts";
import { useEquipmentWarehouses } from "../features/equipment/hooks/useEquipmentWarehouses";
import { useEquipmentEmployees } from "../features/equipment/hooks/useEquipmentEmployees";
import { useEquipmentReservationMovement } from "../features/equipment/hooks/useEquipmentReservationMovement";
import { useUpdateEquipment } from "../features/equipment/hooks/useUpdateEquipment";
import { EquipmentMovementHistory } from "../features/equipment/components/EquipmentMovementHistory";
import { EquipmentMaintenance } from "../features/equipment/components/EquipmentMaintenance";
import { EquipmentLifecycle } from "../features/equipment/components/EquipmentLifecycle";
import { EquipmentInspection } from "../features/equipment/components/EquipmentInspection";
import { EquipmentEventWorkflow } from "../features/equipment/components/EquipmentEventWorkflow";
import { EquipmentTransfer } from "../features/equipment/components/EquipmentTransfer";
import { EquipmentOverview } from "../features/equipment/components/EquipmentOverview";

export function EquipmentDetailPage() {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [responsibleEmployeeId, setResponsibleEmployeeId] = useState("");

  const { equipmentId } = useParams({
    from: "/app/equipment/$equipmentId",
  });

  const {
    data: equipment,
    isLoading,
    isError,
  } = useEquipmentDetail(equipmentId);

  const {
    data: reservations = [],
    isLoading: reservationsLoading,
  } = useEquipmentReservations();

  const {
    data: movements = [],
    isLoading: movementsLoading,
    isError: movementsError,
  } = useEquipmentMovements(equipmentId);

  const equipmentReservations = reservations.filter(
    (reservation) =>
      reservation.inventoryItem.id === equipmentId &&
      reservation.status !== "CANCELLED" &&
      !movements.some(
        (movement) =>
          movement.type === "RESERVED" &&
          movement.reservation?.id === reservation.id,
      ),
  );

  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsError,
  } = useEquipmentProducts();

  const {
    data: warehouses = [],
    isLoading: warehousesLoading,
    isError: warehousesError,
  } = useEquipmentWarehouses();

  const {
    data: employees = [],
    isLoading: employeesLoading,
    isError: employeesError,
  } = useEquipmentEmployees();

  const eventWorkflowStatuses = [
    "RESERVED",
    "PICKING",
    "PACKED",
    "IN_TRANSIT",
    "AT_EVENT",
    "RETURNING",
    "INSPECTION",
  ] as const;

  const isEventWorkflowActive =
    equipment &&
    eventWorkflowStatuses.some((status) => status === equipment.status);

  const activeMovementReservation = isEventWorkflowActive
    ? movements.find((movement) => movement.reservation)?.reservation ?? null
    : null;

  const checkedOutMovement = activeMovementReservation
    ? movements.find(
        (movement) =>
          movement.type === "LOADED" &&
          movement.reservation?.id === activeMovementReservation.id,
      )
    : undefined;



  const { createMovementMutation } = useEquipmentReservationMovement({
    equipmentId,
  });

  const { updateEquipmentMutation } = useUpdateEquipment({
    equipmentId,
    onSuccess: () => setIsEditing(false),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span
          className="loading loading-spinner loading-lg"
          aria-label="Gerät wird geladen"
        />
      </div>
    );
  }

  if (isError || !equipment) {
    return (
      <div role="alert" className="alert alert-error">
        Gerät konnte nicht geladen werden.
      </div>
    );
  }

  const initialValues: EquipmentFormValues = {
    assetNo: equipment.assetNo,
    manufacturerSerial: equipment.manufacturerSerial ?? "",
    barcode: equipment.barcode ?? "",
    status: equipment.status,
    location: equipment.location ?? "",
    purchaseDate: equipment.purchaseDate
      ? equipment.purchaseDate.slice(0, 10)
      : "",
    purchasePrice:
      equipment.purchasePrice !== null && equipment.purchasePrice !== undefined
        ? String(equipment.purchasePrice)
        : "",
    notes: equipment.notes ?? "",
    productId: equipment.productId,
    warehouseId: equipment.warehouseId,
  };

  const formDataLoading = productsLoading || warehousesLoading;
  const formDataError = productsError || warehousesError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <DetailLayout
        title={equipment.product.name}
        description={`Asset-Nr. ${equipment.assetNo}`}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                navigate({
                  to: "/equipment",
                });
              }}
            >
              Zurück
            </Button>

            <Button
              type="button"
              onClick={() => setIsEditing((current) => !current)}
            >
              {isEditing ? "Abbrechen" : "Bearbeiten"}
            </Button>
          </>
        }
      >
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="mb-6 rounded-box border border-base-300 bg-base-100 p-6"
            >
              {formDataLoading && (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg" />
                </div>
              )}

              {formDataError && (
                <div role="alert" className="alert alert-error">
                  Produkte oder Lager konnten nicht geladen werden.
                </div>
              )}

              {!formDataLoading && !formDataError && (
                <EquipmentForm
                  mode="edit"
                  products={products}
                  warehouses={warehouses}
                  initialValues={initialValues}
                  loading={updateEquipmentMutation.isPending}
                  onSubmit={(data) => updateEquipmentMutation.mutate(data)}
                />
              )}

              {updateEquipmentMutation.isError && (
                <div role="alert" className="alert alert-error mt-4">
                  Änderungen konnten nicht gespeichert werden.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <EquipmentTransfer
          equipmentId={equipmentId}
          equipment={equipment}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <EquipmentOverview
            equipment={equipment}
            activeReservation={activeMovementReservation}
            checkedOutMovement={checkedOutMovement}
          />

          <section className="rounded-box border border-base-300 bg-base-100 p-6">
            <h2 className="mb-5 text-lg font-semibold">Produkt & Lager</h2>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-base-content/60">Produktnummer</dt>
                <dd className="font-medium">{equipment.product.productNo}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Produkt</dt>
                <dd>{equipment.product.name}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Marke</dt>
                <dd>{equipment.product.brand ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Modell</dt>
                <dd>{equipment.product.model ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Kategorie</dt>
                <dd>{equipment.product.category ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Lager</dt>
                <dd>{equipment.warehouse.name}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Niederlassung</dt>
                <dd>{equipment.warehouse.branch.name}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Lageradresse</dt>
                <dd>{equipment.warehouse.address ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <EquipmentMaintenance
            equipmentId={equipmentId}
            equipment={equipment}
          />

          <EquipmentLifecycle
            equipmentId={equipmentId}
            equipment={equipment}
            activeReservation={activeMovementReservation}
          />

          {equipment.status === "INSPECTION" && (
            <EquipmentInspection
              equipmentId={equipmentId}
              equipment={equipment}
              activeReservation={activeMovementReservation}
            />
          )}

          <EquipmentEventWorkflow
            equipmentId={equipmentId}
            equipment={equipment}
            activeReservation={activeMovementReservation}
            employees={employees}
            employeesLoading={employeesLoading}
            employeesError={employeesError}
            responsibleEmployeeId={responsibleEmployeeId}
            onResponsibleEmployeeChange={setResponsibleEmployeeId}
          />

          {equipment.status === "AVAILABLE" && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
            >
              <h2 className="text-lg font-semibold">
                Neue Bewegung
              </h2>
              <p className="mt-1 text-sm text-base-content/60">
                Gerät für eine bestehende Event-Reservierung vormerken.
              </p>

              {reservationsLoading ? (
                <div className="mt-5">
                  <span className="loading loading-spinner loading-md" />
                </div>
              ) : equipmentReservations.length === 0 ? (
                <div className="alert mt-5">
                  Keine aktive Reservierung für dieses Gerät vorhanden.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {equipmentReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex flex-col gap-4 rounded-box border border-base-300 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-semibold">
                          {reservation.event.eventNo} ·{" "}
                          {reservation.event.name}
                        </div>

                        <div className="mt-1 text-sm text-base-content/60">
                          {new Intl.DateTimeFormat("de-DE", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(reservation.startDate))}
                          {" – "}
                          {new Intl.DateTimeFormat("de-DE", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(reservation.endDate))}
                        </div>

                        <div className="mt-1 text-sm">
                          Status: {reservation.status}
                        </div>
                      </div>

                      <Button
                        type="button"
                        loading={createMovementMutation.isPending}
                        disabled={
                          createMovementMutation.isPending ||
                          reservation.status !== "CONFIRMED"
                        }
                        onClick={() =>
                          createMovementMutation.mutate(reservation.id)
                        }
                      >
                        Reservieren
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {createMovementMutation.isError && (
                <div role="alert" className="alert alert-error mt-4">
                  Gerätebewegung konnte nicht gespeichert werden.
                </div>
              )}
            </motion.section>
          )}

          <EquipmentMovementHistory
            movements={movements}
            isLoading={movementsLoading}
            isError={movementsError}
          />

          <section className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2">
            <h2 className="mb-3 text-lg font-semibold">Notizen</h2>

            <p className="whitespace-pre-wrap text-base-content/80">
              {equipment.notes || "Keine Notizen vorhanden."}
            </p>
          </section>
        </div>
      </DetailLayout>
    </motion.div>
  );
}
