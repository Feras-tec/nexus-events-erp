import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import { ReservationForm } from "../components/organisms/ReservationForm";
import { ReservationTable } from "../components/organisms/ReservationTable";
import { ReservationStats } from "../features/reservations/components/ReservationStats";
import {
  ReservationFilters,
  type ReservationStatusFilter,
} from "../features/reservations/components/ReservationFilters";
import { ListLayout } from "../components/templates/ListLayout";
import { useReservations } from "../features/reservations/hooks/useReservations";
import { useReservationFormOptions } from "../features/reservations/hooks/useReservationFormOptions";
import { useCreateReservation } from "../features/reservations/hooks/useCreateReservation";


export function ReservationsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ReservationStatusFilter>("ALL");
  const [eventFilter, setEventFilter] = useState("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [createError, setCreateError] = useState("");

  const {
    data: reservations = [],
    isLoading,
    isError,
  } = useReservations();

  const {
    events,
    eventsLoading,
    equipment,
    equipmentLoading,
  } = useReservationFormOptions();

  const { createReservationMutation } = useCreateReservation({
    onSuccess: () => {
      setCreateError("");
      setShowForm(false);
    },
    onError: setCreateError,
  });

  const filterEvents = Array.from(
    new Map(
      reservations.map((reservation) => [
        reservation.event.id,
        {
          id: reservation.event.id,
          name: reservation.event.name,
        },
      ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const warehouses = Array.from(
    new Map(
      reservations.map((reservation) => [
        reservation.inventoryItem.warehouse.id,
        {
          id: reservation.inventoryItem.warehouse.id,
          name: reservation.inventoryItem.warehouse.name,
        },
      ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const normalizedSearch = search.trim().toLowerCase();

  const filteredReservations = reservations.filter((reservation) => {
    if (
      statusFilter !== "ALL" &&
      reservation.status !== statusFilter
    ) {
      return false;
    }

    if (
      eventFilter !== "ALL" &&
      reservation.event.id !== eventFilter
    ) {
      return false;
    }

    if (
      warehouseFilter !== "ALL" &&
      reservation.inventoryItem.warehouse.id !== warehouseFilter
    ) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const searchableText = [
      reservation.event.eventNo,
      reservation.event.name,
      reservation.inventoryItem.assetNo,
      reservation.inventoryItem.manufacturerSerial,
      reservation.inventoryItem.product.productNo,
      reservation.inventoryItem.product.name,
      reservation.inventoryItem.product.brand,
      reservation.inventoryItem.product.model,
      reservation.inventoryItem.warehouse.name,
      reservation.status,
      reservation.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  return (
    <ListLayout
      title={t("reservations.title")}
      description={t("reservations.description")}
      searchValue={search}
      searchPlaceholder={t("reservations.search")}
      onSearchChange={setSearch}
      actions={
        <Button
          onClick={() => {
            setCreateError("");
            setShowForm((current) => !current);
          }}
        >
          {showForm ? t("reservations.cancel") : t("reservations.new")}
        </Button>
      }
    >
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <ReservationForm
            events={events}
            equipment={equipment}
            loading={
              eventsLoading ||
              equipmentLoading ||
              createReservationMutation.isPending
            }
            onSubmit={(data) => {
              setCreateError("");
              createReservationMutation.mutate(data);
            }}
          />

          {createError && (
            <div role="alert" className="alert alert-error">
              <span>{createError}</span>
            </div>
          )}
        </motion.div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <span
            className="loading loading-spinner loading-lg"
            aria-label={t("reservations.loading")}
          />
        </div>
      )}

      {isError && (
        <div role="alert" className="alert alert-error">
          {t("reservations.loadError")}
        </div>
      )}

      {!isLoading && !isError && (
        <ReservationStats reservations={reservations} />
      )}

      {!isLoading && !isError && (
        <ReservationFilters
          status={statusFilter}
          eventId={eventFilter}
          warehouseId={warehouseFilter}
          events={filterEvents}
          warehouses={warehouses}
          onStatusChange={setStatusFilter}
          onEventChange={setEventFilter}
          onWarehouseChange={setWarehouseFilter}
          onReset={() => {
            setStatusFilter("ALL");
            setEventFilter("ALL");
            setWarehouseFilter("ALL");
          }}
        />
      )}

      {!isLoading && !isError && (
        <ReservationTable
          reservations={filteredReservations}
          onView={(reservationId) => {
            navigate({
              to: "/reservations/$reservationId",
              params: { reservationId },
            });
          }}
        />
      )}
    </ListLayout>
  );
}
