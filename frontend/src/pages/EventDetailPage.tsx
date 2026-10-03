import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import { StatusChip } from "../components/atoms/StatusChip";
import {
  EventForm,
  type EventFormData,
} from "../components/organisms/EventForm";
import { DetailLayout } from "../components/templates/DetailLayout";
import { apiFetch } from "../services/api";

type CustomerOption = {
  id: string;
  customerNo: string;
  type: string;
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

type EventDetail = {
  id: string;
  eventNo: string;
  name: string;
  type?: string | null;
  location?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  description?: string | null;
  customerId: string;

  customer: {
    id: string;
    customerNo: string;
    type?: string;
    companyName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
};

type EventResponse = {
  data: EventDetail;
};

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function toDateTimeLocal(date: string) {
  const value = new Date(date);

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getCustomerName(customer: EventDetail["customer"]) {
  if (customer.companyName) {
    return customer.companyName;
  }

  const fullName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ");

  return fullName || "—";
}

export function EventDetailPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);

  const { eventId } = useParams({
    from: "/app/events/$eventId",
  });

  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["events", eventId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(`/api/events/${eventId}`, token);

      const result = (await response.json()) as EventResponse;

      return result.data;
    },
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/customers", token);

      const result = (await response.json()) as {
        data: CustomerOption[];
      };

      return result.data;
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const token = await getToken();

      const payload = {
        name: data.name,
        type: data.type || undefined,
        location: data.location || undefined,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        status: data.status,
        description: data.description || undefined,
      };

      const response = await apiFetch(`/api/events/${eventId}`, token, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["events", eventId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["events"],
        }),
      ]);

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
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="rounded-box border border-base-300 bg-base-100 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">Kunde</h2>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-base-content/60">Name</div>
                <div className="font-medium">
                  {getCustomerName(event.customer)}
                </div>
              </div>

              <div>
                <div className="text-sm text-base-content/60">Kundennr.</div>
                <div>{event.customer.customerNo}</div>
              </div>

              <div>
                <div className="text-sm text-base-content/60">E-Mail</div>
                <div>{event.customer.email || "—"}</div>
              </div>

              <div>
                <div className="text-sm text-base-content/60">Telefon</div>
                <div>{event.customer.phone || "—"}</div>
              </div>
            </div>
          </motion.div>
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
              className="rounded-box border border-base-300 bg-base-100 p-6"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-sm text-base-content/60">Status</div>

                  <div className="mt-1">
                    <StatusChip status={event.status} />
                  </div>
                </div>

                <div>
                  <div className="text-sm text-base-content/60">Typ</div>

                  <div className="mt-1">{event.type || "—"}</div>
                </div>

                <div>
                  <div className="text-sm text-base-content/60">Start</div>

                  <div className="mt-1">{formatDateTime(event.startDate)}</div>
                </div>

                <div>
                  <div className="text-sm text-base-content/60">Ende</div>

                  <div className="mt-1">{formatDateTime(event.endDate)}</div>
                </div>

                <div>
                  <div className="text-sm text-base-content/60">Ort</div>

                  <div className="mt-1">{event.location || "—"}</div>
                </div>
              </div>

              <div className="divider" />

              <div>
                <div className="text-sm text-base-content/60">Beschreibung</div>

                <p className="mt-2 whitespace-pre-wrap">
                  {event.description || "Keine Beschreibung vorhanden."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DetailLayout>
    </motion.div>
  );
}
