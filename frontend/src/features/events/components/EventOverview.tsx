import { useTranslation } from "react-i18next";

import { StatusChip } from "../../../components/atoms/StatusChip";
import type { EventDetail } from "../types/event.types";
import { formatDateTime } from "../utils/event-formatters";

type EventOverviewProps = {
  event: EventDetail;
};

export function EventOverview({
  event,
}: EventOverviewProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="text-sm text-base-content/60">
            {t("events.overview.status")}
          </div>

          <div className="mt-1">
            <StatusChip status={event.status} />
          </div>
        </div>

        <div>
          <div className="text-sm text-base-content/60">
            {t("events.overview.type")}
          </div>

          <div className="mt-1">
            {event.type || "—"}
          </div>
        </div>

        <div>
          <div className="text-sm text-base-content/60">
            {t("events.overview.start")}
          </div>

          <div className="mt-1">
            {formatDateTime(event.startDate)}
          </div>
        </div>

        <div>
          <div className="text-sm text-base-content/60">
            {t("events.overview.end")}
          </div>

          <div className="mt-1">
            {formatDateTime(event.endDate)}
          </div>
        </div>

        <div>
          <div className="text-sm text-base-content/60">
            {t("events.overview.location")}
          </div>

          <div className="mt-1">
            {event.location || "—"}
          </div>
        </div>
      </div>

      <div className="divider" />

      <div>
        <div className="text-sm text-base-content/60">
          {t("events.overview.description")}
        </div>

        <p className="mt-2 whitespace-pre-wrap">
          {event.description ||
            t("events.overview.noDescription")}
        </p>
      </div>
    </div>
  );
}
