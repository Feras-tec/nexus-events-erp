import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { Button } from "../components/atoms/Button";
import { ConfirmDeleteDialog } from "../components/molecules/ConfirmDeleteDialog";
import {
  EventForm,
  type EventFormData,
} from "../components/organisms/EventForm";
import { DetailLayout } from "../components/templates/DetailLayout";
import { useEventDetail } from "../features/events/hooks/useEventDetail";
import { useEventCustomers } from "../features/events/hooks/useEventCustomers";
import { useUpdateEvent } from "../features/events/hooks/useUpdateEvent";
import { useCancelEvent } from "../features/events/hooks/useCancelEvent";
import { EventOverview } from "../features/events/components/EventOverview";
import { EventCustomerCard } from "../features/events/components/EventCustomerCard";
import { toDateTimeLocal } from "../features/events/utils/event-formatters";

export function EventDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { eventId } = useParams({
    from: "/app/events/$eventId",
  });

  const {
    data: event,
    isLoading,
    isError,
  } = useEventDetail(eventId);

  const {
    data: customers = [],
    isLoading: customersLoading,
  } = useEventCustomers();

  const { updateEventMutation } = useUpdateEvent({
    eventId,
    onSuccess: () => {
      setIsEditing(false);
    },
  });

  const { cancelEventMutation } = useCancelEvent({
    eventId,
    onSuccess: () => {
      setShowCancelDialog(false);
      setIsEditing(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span
          className="loading loading-spinner loading-lg"
          aria-label={t("events.detail.loading")}
        />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div role="alert" className="alert alert-error">
        {t("events.detail.loadError")}
      </div>
    );
  }

  const initialValues: EventFormData = {
    eventNo: event.eventNo,
    name: event.name,
    type: event.type || "",
    location: event.location || "",
    startDate: toDateTimeLocal(event.startDate),
    endDate: toDateTimeLocal(event.endDate),
    status: event.status,
    description: event.description || "",
    customerId: event.customerId,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <DetailLayout
        title={event.name}
        description={event.eventNo}
        actions={
          <>
            <Button
              type="button"
              className="btn-outline"
              onClick={() => {
                navigate({ to: "/events" });
              }}
            >
              ← {t("common.back")}
            </Button>

            {event.status !== "CANCELLED" && (
              <Button
                type="button"
                variant="error"
                onClick={() => {
                  setShowCancelDialog(true);
                }}
              >
                {t("events.detail.cancel")}
              </Button>
            )}

            <Button
              type="button"
              onClick={() => {
                setIsEditing((current) => !current);
              }}
            >
              {isEditing
                ? t("common.cancel")
                : t("common.edit")}
            </Button>
          </>
        }
        sidebar={
          <EventCustomerCard customer={event.customer} />
        }
      >
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <EventForm
                key={event.id}
                mode="edit"
                customers={customers}
                initialValues={initialValues}
                loading={
                  customersLoading ||
                  updateEventMutation.isPending
                }
                onSubmit={(data) => {
                  updateEventMutation.mutate(data);
                }}
              />

              {updateEventMutation.isError && (
                <div
                  role="alert"
                  className="alert alert-error mt-4"
                >
                  {t("events.detail.updateError")}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <EventOverview event={event} />
            </motion.div>
          )}
        </AnimatePresence>
      </DetailLayout>

      {cancelEventMutation.isError && (
        <div
          role="alert"
          className="alert alert-error mt-4"
        >
          {t("events.detail.cancelError")}
        </div>
      )}

      <ConfirmDeleteDialog
        open={showCancelDialog}
        title={t("events.detail.cancelTitle")}
        message={t("events.detail.cancelMessage", {
          name: event.name,
        })}
        confirmLabel={t("events.detail.confirmCancel")}
        cancelLabel={t("common.cancel")}
        loading={cancelEventMutation.isPending}
        onConfirm={() => {
          cancelEventMutation.mutate();
        }}
        onCancel={() => {
          setShowCancelDialog(false);
        }}
      />
    </motion.div>
  );
}
