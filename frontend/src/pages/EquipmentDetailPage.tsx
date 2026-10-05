import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import {
  EquipmentForm,
  type EquipmentFormValues,
} from "../components/organisms/EquipmentForm";
import type {
} from "../features/equipment/types/equipment.types";
import { Button } from "../components/atoms/Button";
import { DetailLayout } from "../components/templates/DetailLayout";
import { useEquipmentDetail } from "../features/equipment/hooks/useEquipmentDetail";
import { useEquipmentMovements } from "../features/equipment/hooks/useEquipmentMovements";
import { useEquipmentProducts } from "../features/equipment/hooks/useEquipmentProducts";
import { useEquipmentWarehouses } from "../features/equipment/hooks/useEquipmentWarehouses";
import { useEquipmentEmployees } from "../features/equipment/hooks/useEquipmentEmployees";
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
            employees={employees}
            employeesLoading={employeesLoading}
            employeesError={employeesError}
            responsibleEmployeeId={responsibleEmployeeId}
            onResponsibleEmployeeChange={setResponsibleEmployeeId}
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
