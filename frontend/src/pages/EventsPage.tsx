import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "../components/atoms/Button";
import {
  EventForm,
  type EventFormData,
} from "../components/organisms/EventForm";
import { EventTable, type EventItem } from "../components/organisms/EventTable";
import { ListLayout } from "../components/templates/ListLayout";
import { apiFetch } from "../services/api";

type EventsResponse = {
  data: EventItem[];
};

export function EventsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/customers", token);

      const result = (await response.json()) as {
        data: {
          id: string;
          customerNo: string;
          type: string;
          companyName?: string | null;
          firstName?: string | null;
          lastName?: string | null;
        }[];
      };

      return result.data;
    },
  });

  const {
    data: events = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/events", token);

      const result = (await response.json()) as EventsResponse;

      return result.data;
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const token = await getToken();

      const payload = {
        ...data,
        type: data.type || undefined,
        location: data.location || undefined,
        description: data.description || undefined,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };

      const response = await apiFetch("/api/events", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return response.json();
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["events"],
      });

      setShowEventForm(false);
    },
  });

  const normalizedSearch = search.trim().toLowerCase();

  const filteredEvents = events.filter((event) => {
    if (!normalizedSearch) return true;

    const customerName = event.customer.companyName
      ? event.customer.companyName
      : [event.customer.firstName, event.customer.lastName]
          .filter(Boolean)
          .join(" ");

    const searchableText = [
      event.eventNo,
      event.name,
      event.type,
      event.location,
      event.status,
      event.description,
      event.customer.customerNo,
      customerName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  return (
    <ListLayout
      title="Events"
      description="Veranstaltungen und Projekte verwalten."
      searchValue={search}
      searchPlaceholder="Events suchen..."
      onSearchChange={setSearch}
      actions={
        <Button onClick={() => setShowEventForm((current) => !current)}>
          {showEventForm ? "Abbrechen" : "Neues Event"}
        </Button>
      }
    >
      {showEventForm && (
        <div className="space-y-4">
          <EventForm
            customers={customers}
            loading={customersLoading || createEventMutation.isPending}
            onSubmit={(data) => {
              createEventMutation.mutate(data);
            }}
          />

          {createEventMutation.isError && (
            <div role="alert" className="alert alert-error">
              Event konnte nicht gespeichert werden.
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <span
            className="loading loading-spinner loading-lg"
            aria-label="Events werden geladen"
          />
        </div>
      )}

      {isError && (
        <div role="alert" className="alert alert-error">
          Events konnten nicht geladen werden.
        </div>
      )}

      {!isLoading && !isError && (
        <EventTable
          events={filteredEvents}
          onView={(eventId) => {
            navigate({
              to: "/events/$eventId",
              params: { eventId },
            });
          }}
        />
      )}
    </ListLayout>
  );
}
