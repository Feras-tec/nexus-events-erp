import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

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
          aria-label="Event wird geladen"
        />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div role="alert" className="alert alert-error">
        Event konnte nicht geladen werden.
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
              ← Zurück
            </Button>

            {event.status !== "CANCELLED" && (
              <Button
                type="button"
                variant="error"
                onClick={() => {
                  setShowCancelDialog(true);
                }}
              >
                Stornieren
              </Button>
            )}

            <Button
              type="button"
              onClick={() => {
                setIsEditing((current) => !current);
              }}
            >
              {isEditing ? "Abbrechen" : "Bearbeiten"}
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
                loading={customersLoading || updateEventMutation.isPending}
                onSubmit={(data) => {
                  updateEventMutation.mutate(data);
                }}
              />

              {updateEventMutation.isError && (
                <div role="alert" className="alert alert-error mt-4">
                  Event konnte nicht aktualisiert werden.
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
        <div role="alert" className="alert alert-error mt-4">
          Event konnte nicht storniert werden.
        </div>
      )}

      <ConfirmDeleteDialog
        open={showCancelDialog}
        title="Event stornieren"
        message={`Möchten Sie das Event "${event.name}" wirklich stornieren? Das Event wird nicht gelöscht.`}
        confirmLabel="Event stornieren"
        cancelLabel="Abbrechen"
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
