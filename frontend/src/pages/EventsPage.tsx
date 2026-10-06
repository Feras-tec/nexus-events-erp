import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "../components/atoms/Button";
import { EventForm } from "../components/organisms/EventForm";
import { EventTable } from "../components/organisms/EventTable";
import { ListLayout } from "../components/templates/ListLayout";
import { useEvents } from "../features/events/hooks/useEvents";
import { useEventFormCustomers } from "../features/events/hooks/useEventFormCustomers";
import { useCreateEvent } from "../features/events/hooks/useCreateEvent";

export function EventsPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);

  const {
    customers,
    customersLoading,
  } = useEventFormCustomers();

  const {
    events,
    isLoading,
    isError,
  } = useEvents();

  const { createEventMutation } = useCreateEvent({
    onSuccess: () => setShowEventForm(false),
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
