import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { motion } from "motion/react";

import type { EquipmentFormValues } from "../components/organisms/EquipmentForm";
import { Button } from "../components/atoms/Button";
import { DetailLayout } from "../components/templates/DetailLayout";
import { useEquipmentDetail } from "../features/equipment/hooks/useEquipmentDetail";
import { useEquipmentMovements } from "../features/equipment/hooks/useEquipmentMovements";
import { useEquipmentProducts } from "../features/equipment/hooks/useEquipmentProducts";
import { useEquipmentWarehouses } from "../features/equipment/hooks/useEquipmentWarehouses";
import { useUpdateEquipment } from "../features/equipment/hooks/useUpdateEquipment";
import { EquipmentMovementHistory } from "../features/equipment/components/EquipmentMovementHistory";
import { EquipmentMaintenance } from "../features/equipment/components/EquipmentMaintenance";
import { EquipmentLifecycle } from "../features/equipment/components/EquipmentLifecycle";
import { EquipmentInspection } from "../features/equipment/components/EquipmentInspection";
import { EquipmentEventWorkflow } from "../features/equipment/components/EquipmentEventWorkflow";
import { EquipmentTransfer } from "../features/equipment/components/EquipmentTransfer";
import { EquipmentOverview } from "../features/equipment/components/EquipmentOverview";
import { EquipmentProductWarehouse } from "../features/equipment/components/EquipmentProductWarehouse";
import { EquipmentReservationStart } from "../features/equipment/components/EquipmentReservationStart";
import { EquipmentEditPanel } from "../features/equipment/components/EquipmentEditPanel";

export function EquipmentDetailPage() {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);

  const { equipmentId } = useParams({
    from: "/app/equipment/$equipmentId",
  });

  const {
    data: equipment,
    isLoading,
    isError,
  } = useEquipmentDetail(equipmentId);

  const {
    data: movements = [],
    isLoading: movementsLoading,
    isError: movementsError,
  } = useEquipmentMovements(equipmentId);

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
        <EquipmentEditPanel
          isEditing={isEditing}
          initialValues={initialValues}
          products={products}
          warehouses={warehouses}
          dataLoading={formDataLoading}
          dataError={formDataError}
          loading={updateEquipmentMutation.isPending}
          updateError={updateEquipmentMutation.isError}
          onSubmit={(data) => updateEquipmentMutation.mutate(data)}
        />

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

          <EquipmentProductWarehouse equipment={equipment} />

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
          />

          {equipment.status === "AVAILABLE" && (
            <EquipmentReservationStart
              equipmentId={equipmentId}
              movements={movements}
            />
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
