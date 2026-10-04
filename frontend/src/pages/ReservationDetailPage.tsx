import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import { StatusChip } from "../components/atoms/StatusChip";
import { ConfirmDeleteDialog } from "../components/molecules/ConfirmDeleteDialog";
import {
  ReservationForm,
  type ReservationFormData,
} from "../components/organisms/ReservationForm";
import { DetailLayout } from "../components/templates/DetailLayout";
import { apiFetch } from "../services/api";

type ReservationDetail = {
  id: string;
  startDate: string;
  endDate: string;
  status: ReservationFormData["status"];
  notes?: string | null;
  eventId: string;
  inventoryItemId: string;

  event: {
    id: string;
    eventNo: string;
    name: string;
    type?: string | null;
    location?: string | null;
    startDate: string;
    endDate: string;
    status: string;
    customerId: string;

    customer: {
      id: string;
      customerNo: string;
      companyName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    };
  };

  inventoryItem: {
    id: string;
    assetNo: string;
    manufacturerSerial?: string | null;
    barcode?: string | null;
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

      branch: {
        id: string;
        name: string;
      };
    };
  };
};

type ApiError = {
  error?: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getCustomerName(customer: ReservationDetail["event"]["customer"]) {
  if (customer.companyName) {
    return customer.companyName;
  }

  return (
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—"
  );
}

export function ReservationDetailPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const { reservationId } = useParams({
    from: "/app/reservations/$reservationId",
  });

  const {
    data: reservation,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["reservations", reservationId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/reservations/${reservationId}`,
        token,
      );

      if (!response.ok) {
        throw new Error("Reservation could not be loaded");
      }

      return (await response.json()) as ReservationDetail;
    },
  });

  const updateReservationMutation = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      const token = await getToken();

      const payload = {
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        status: data.status,
        notes: data.notes.trim() || undefined,
      };

      const response = await apiFetch(
        `/api/reservations/${reservationId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as ApiError;

        if (response.status === 409) {
          throw new Error(
            "Dieses Gerät ist im ausgewählten Zeitraum bereits reserviert.",
          );
        }

        throw new Error(
          result.error || "Änderungen konnten nicht gespeichert werden.",
        );
      }

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["reservations", reservationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["reservations"],
        }),
      ]);

      setUpdateError("");
      setIsEditing(false);
    },

    onError: (error) => {
      setUpdateError(
        error instanceof Error
          ? error.message
          : "Änderungen konnten nicht gespeichert werden.",
      );
    },
  });

  const cancelReservationMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/reservations/${reservationId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: "CANCELLED",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Reservation could not be cancelled");
      }

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["reservations", reservationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["reservations"],
        }),
      ]);

      setShowCancelDialog(false);
      setIsEditing(false);
    },
  });

  const reactivateReservationMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      try {
        const response = await apiFetch(
          `/api/reservations/${reservationId}`,
          token,
          {
            method: "PATCH",
            body: JSON.stringify({
              status: "CONFIRMED",
            }),
          },
        );

        return response.json();
      } catch (error) {
        if (error instanceof Error && error.message === "API-Fehler: 409") {
          throw new Error(
            "Die Reservierung kann nicht reaktiviert werden, weil das Gerät in diesem Zeitraum bereits reserviert ist.",
          );
        }

        throw error;
      }
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["reservations", reservationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["reservations"],
        }),
      ]);

      setUpdateError("");
    },

    onError: (error) => {
      setUpdateError(
        error instanceof Error
          ? error.message
          : "Reservierung konnte nicht reaktiviert werden.",
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span
          className="loading loading-spinner loading-lg"
          aria-label="Reservierung wird geladen"
        />
      </div>
    );
  }

  if (isError || !reservation) {
    return (
      <div role="alert" className="alert alert-error">
        Reservierung konnte nicht geladen werden.
      </div>
    );
  }

  const initialValues: ReservationFormData = {
    eventId: reservation.eventId,
    inventoryItemId: reservation.inventoryItemId,
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    status: reservation.status,
    notes: reservation.notes ?? "",
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <DetailLayout
          title="Reservierung"
          description={`${reservation.event.eventNo} · ${reservation.inventoryItem.assetNo}`}
          actions={
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  navigate({
                    to: "/reservations",
                  })
                }
              >
                Zurück
              </Button>

              {reservation.status !== "CANCELLED" && (
                <>
                  <Button
                    type="button"
                    onClick={() => {
                      setUpdateError("");
                      setIsEditing((current) => !current);
                    }}
                  >
                    {isEditing ? "Abbrechen" : "Bearbeiten"}
                  </Button>

                  <Button
                    type="button"
                    variant="error"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Stornieren
                  </Button>
                </>
              )}

              {reservation.status === "CANCELLED" && (
                <Button
                  type="button"
                  onClick={() => {
                    setUpdateError("");
                    reactivateReservationMutation.mutate();
                  }}
                  loading={reactivateReservationMutation.isPending}
                >
                  Reaktivieren
                </Button>
              )}
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
                className="mb-6"
              >
                <ReservationForm
                  events={[reservation.event]}
                  equipment={[reservation.inventoryItem]}
                  initialValues={initialValues}
                  editMode
                  loading={updateReservationMutation.isPending}
                  onSubmit={(data) => {
                    setUpdateError("");
                    updateReservationMutation.mutate(data);
                  }}
                />

                {updateError && (
                  <div role="alert" className="alert alert-error mt-4">
                    {updateError}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

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
                    {formatDateTime(reservation.startDate)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-base-content/60">Bis</dt>
                  <dd className="font-medium">
                    {formatDateTime(reservation.endDate)}
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
                  <dd>{getCustomerName(reservation.event.customer)}</dd>
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
                  <dt className="text-sm text-base-content/60">
                    Marke / Modell
                  </dt>
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
                  <dt className="text-sm text-base-content/60">
                    Niederlassung
                  </dt>
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

          {cancelReservationMutation.isError && (
            <div role="alert" className="alert alert-error mt-6">
              Reservierung konnte nicht storniert werden.
            </div>
          )}

          {reservation.status === "CANCELLED" && updateError && (
            <div role="alert" className="alert alert-error mt-6">
              {updateError}
            </div>
          )}
        </DetailLayout>
      </motion.div>

      <ConfirmDeleteDialog
        open={showCancelDialog}
        title="Reservierung stornieren?"
        message="Möchten Sie diese Reservierung wirklich stornieren? Das Gerät wird danach für diesen Zeitraum wieder verfügbar."
        confirmLabel="Stornieren"
        cancelLabel="Abbrechen"
        loading={cancelReservationMutation.isPending}
        onConfirm={() => cancelReservationMutation.mutate()}
        onCancel={() => setShowCancelDialog(false)}
      />
    </>
  );
}
