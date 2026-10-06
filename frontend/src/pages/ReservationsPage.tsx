import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import { ReservationForm } from "../components/organisms/ReservationForm";
import { ReservationTable } from "../components/organisms/ReservationTable";
import { ListLayout } from "../components/templates/ListLayout";
import { useReservations } from "../features/reservations/hooks/useReservations";
import { useReservationFormOptions } from "../features/reservations/hooks/useReservationFormOptions";
import { useCreateReservation } from "../features/reservations/hooks/useCreateReservation";


export function ReservationsPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
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

  const normalizedSearch = search.trim().toLowerCase();

  const filteredReservations = reservations.filter((reservation) => {
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
      title="Reservierungen"
      description="Geräte für Events reservieren und Verfügbarkeiten verwalten."
      searchValue={search}
      searchPlaceholder="Reservierungen suchen..."
      onSearchChange={setSearch}
      actions={
        <Button
          onClick={() => {
            setCreateError("");
            setShowForm((current) => !current);
          }}
        >
          {showForm ? "Abbrechen" : "Neue Reservierung"}
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
            aria-label="Reservierungen werden geladen"
          />
        </div>
      )}

      {isError && (
        <div role="alert" className="alert alert-error">
          Reservierungen konnten nicht geladen werden.
        </div>
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
