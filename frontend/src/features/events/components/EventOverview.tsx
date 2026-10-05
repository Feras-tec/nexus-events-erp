import { StatusChip } from "../../../components/atoms/StatusChip";
import type { EventDetail } from "../types/event.types";
import { formatDateTime } from "../utils/event-formatters";

type EventOverviewProps = {
  event: EventDetail;
};

export function EventOverview({
  event,
}: EventOverviewProps) {
  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="text-sm text-base-content/60">
            Status
          </div>

          <div className="mt-1">
            <StatusChip status={event.status} />
          </div>
        </div>

        <div>
          <div className="text-sm text-base-content/60">
            Typ
          </div>

          <div className="mt-1">
            {event.type || "—"}
          </div>
        </div>

        <div>
          <div className="text-sm text-base-content/60">
            Start
          </div>

          <div className="mt-1">
            {formatDateTime(event.startDate)}
          </div>
        </div>

        <div>
          <div className="text-sm text-base-content/60">
            Ende
          </div>

          <div className="mt-1">
            {formatDateTime(event.endDate)}
          </div>
        </div>

        <div>
          <div className="text-sm text-base-content/60">
            Ort
          </div>

          <div className="mt-1">
            {event.location || "—"}
          </div>
        </div>
      </div>

      <div className="divider" />

      <div>
        <div className="text-sm text-base-content/60">
          Beschreibung
        </div>

        <p className="mt-2 whitespace-pre-wrap">
          {event.description || "Keine Beschreibung vorhanden."}
        </p>
      </div>
    </div>
  );
}
