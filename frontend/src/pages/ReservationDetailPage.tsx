import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import { ConfirmDeleteDialog } from "../components/molecules/ConfirmDeleteDialog";
import {
  ReservationForm,
  type ReservationFormData,
} from "../components/organisms/ReservationForm";
import { DetailLayout } from "../components/templates/DetailLayout";
import { ReservationOverview } from "../features/reservations/components/ReservationOverview";
import { useReservationDetail } from "../features/reservations/hooks/useReservationDetail";
import { useUpdateReservation } from "../features/reservations/hooks/useUpdateReservation";
import { useCancelReservation } from "../features/reservations/hooks/useCancelReservation";
import { useReactivateReservation } from "../features/reservations/hooks/useReactivateReservation";

export function ReservationDetailPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
  } = useReservationDetail(reservationId);

  const { updateReservationMutation } = useUpdateReservation({
    reservationId,
    onSuccess: () => {
      setUpdateError("");
      setIsEditing(false);
    },
    onError: (message) => {
      setUpdateError(message);
    },
  });

  const { cancelReservationMutation } = useCancelReservation({
    reservationId,
    onSuccess: () => {
      setShowCancelDialog(false);
      setIsEditing(false);
    },
  });

  const { reactivateReservationMutation } =
    useReactivateReservation({
      reservationId,
      onSuccess: () => {
        setUpdateError("");
      },
      onError: (message) => {
        setUpdateError(message);
      },
    });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span
          className="loading loading-spinner loading-lg"
          aria-label={t("reservations.detail.loading")}
        />
      </div>
    );
  }

  if (isError || !reservation) {
    return (
      <div role="alert" className="alert alert-error">
        {t("reservations.detail.loadError")}
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
          title={t("reservations.detail.title")}
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
                {t("reservations.detail.back")}
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
                    {isEditing ? t("reservations.detail.cancelEdit") : t("reservations.detail.edit")}
                  </Button>

                  <Button
                    type="button"
                    variant="error"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    {t("reservations.detail.cancelReservation")}
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
                  {t("reservations.detail.reactivate")}
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

          <ReservationOverview reservation={reservation} />

          {cancelReservationMutation.isError && (
            <div role="alert" className="alert alert-error mt-6">
              {t("reservations.detail.cancelError")}
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
        title={t("reservations.detail.confirmTitle")}
        message={t("reservations.detail.confirmMessage")}
        confirmLabel={t("reservations.detail.cancelReservation")}
        cancelLabel={t("reservations.detail.cancelEdit")}
        loading={cancelReservationMutation.isPending}
        onConfirm={() => cancelReservationMutation.mutate()}
        onCancel={() => setShowCancelDialog(false)}
      />
    </>
  );
}
