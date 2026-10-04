import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import type { EventItem } from "../components/organisms/EventTable";
import {
  ReservationForm,
  type ReservationFormData,
} from "../components/organisms/ReservationForm";
import {
  ReservationTable,
  type ReservationItem,
} from "../components/organisms/ReservationTable";
import { ListLayout } from "../components/templates/ListLayout";
import { apiFetch } from "../services/api";

type EquipmentItem = {
  id: string;
  assetNo: string;
  manufacturerSerial?: string | null;
  status: string;
  location?: string | null;

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

type ApiError = {
  error?: string;
};

export function ReservationsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [createError, setCreateError] = useState("");

  const {
    data: reservations = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/reservations", token);

      if (!response.ok) {
        throw new Error("Reservations could not be loaded");
      }

      return (await response.json()) as ReservationItem[];
    },
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/events", token);

      if (!response.ok) {
        throw new Error("Events could not be loaded");
      }

      const result = (await response.json()) as {
        data: EventItem[];
      };

      return result.data;
    },
  });

  const { data: equipment = [], isLoading: equipmentLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiFetch("/api/inventory-items", token);

      if (!response.ok) {
        throw new Error("Equipment could not be loaded");
      }

      const result = (await response.json()) as {
        data: EquipmentItem[];
      };

      return result.data;
    },
  });

  const createReservationMutation = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      const token = await getToken();

      const payload = {
        eventId: data.eventId,
        inventoryItemId: data.inventoryItemId,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        status: data.status,
        notes: data.notes.trim() || undefined,
      };

      let response: Response;

      try {
        response = await apiFetch("/api/reservations", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch (error) {
        if (error instanceof Error && error.message === "API-Fehler: 409") {
          throw new Error(
            "Dieses Gerät ist im ausgewählten Zeitraum bereits reserviert.",
          );
        }

        throw error;
      }

      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as ApiError;

        if (
          response.status === 409 ||
          result.error === "Inventory item is already reserved for this period"
        ) {
          throw new Error(
            "Dieses Gerät ist im ausgewählten Zeitraum bereits reserviert.",
          );
        }

        if (
          result.error === "Inventory item is not available for reservation"
        ) {
          throw new Error("Dieses Gerät kann derzeit nicht reserviert werden.");
        }

        throw new Error(
          result.error || "Reservierung konnte nicht gespeichert werden.",
        );
      }

      return response.json();
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["reservations"],
      });

      setCreateError("");
      setShowForm(false);
    },

    onError: (error) => {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Reservierung konnte nicht gespeichert werden.",
      );
    },
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
