import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { EventItem } from "./EventTable";

export type ReservationFormData = {
  eventId: string;
  inventoryItemId: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes: string;
};

type ReservationEquipment = {
  id: string;
  assetNo: string;
  status: string;
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

type ReservationFormProps = {
  events: EventItem[];
  equipment: ReservationEquipment[];
  loading?: boolean;
  initialValues?: Partial<ReservationFormData>;
  editMode?: boolean;
  onSubmit: (data: ReservationFormData) => void;
};

function toDateTimeLocal(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

export function ReservationForm({
  events,
  equipment,
  loading = false,
  initialValues,
  editMode = false,
  onSubmit,
}: ReservationFormProps) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<ReservationFormData>({
    eventId: initialValues?.eventId ?? "",
    inventoryItemId: initialValues?.inventoryItemId ?? "",
    startDate: toDateTimeLocal(initialValues?.startDate),
    endDate: toDateTimeLocal(initialValues?.endDate),
    status: initialValues?.status ?? "PENDING",
    notes: initialValues?.notes ?? "",
  });

  useEffect(() => {
    if (!initialValues) return;

    setFormData({
      eventId: initialValues.eventId ?? "",
      inventoryItemId: initialValues.inventoryItemId ?? "",
      startDate: toDateTimeLocal(initialValues.startDate),
      endDate: toDateTimeLocal(initialValues.endDate),
      status: initialValues.status ?? "PENDING",
      notes: initialValues.notes ?? "",
    });
  }, [initialValues]);

  function handleEventChange(eventId: string) {
    const selectedEvent = events.find((event) => event.id === eventId);

    setFormData((current) => ({
      ...current,
      eventId,
      startDate: selectedEvent
        ? toDateTimeLocal(selectedEvent.startDate)
        : current.startDate,
      endDate: selectedEvent
        ? toDateTimeLocal(selectedEvent.endDate)
        : current.endDate,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(formData);
  }

  const selectableEquipment = equipment.filter(
    (item) => item.status !== "LOST" && item.status !== "RETIRED",
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="form-control md:col-span-2">
          <span className="label-text mb-2 font-medium">{t("reservations.form.event")}</span>

          <select
            className="select select-bordered w-full"
            value={formData.eventId}
            onChange={(event) => handleEventChange(event.target.value)}
            disabled={loading || editMode}
            required
          >
            <option value="">{t("reservations.form.selectEvent")}</option>

            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.eventNo} – {event.name}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control md:col-span-2">
          <span className="label-text mb-2 font-medium">{t("reservations.form.equipment")}</span>

          <select
            className="select select-bordered w-full"
            value={formData.inventoryItemId}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                inventoryItemId: event.target.value,
              }))
            }
            disabled={loading || editMode}
            required
          >
            <option value="">{t("reservations.form.selectEquipment")}</option>

            {selectableEquipment.map((item) => (
              <option key={item.id} value={item.id}>
                {item.assetNo} – {item.product.name}
                {item.product.model ? ` – ${item.product.model}` : ""}
                {" – "}
                {item.warehouse.name}
              </option>
            ))}
          </select>

          <span className="mt-1 text-xs text-base-content/60">
            {t("reservations.form.equipmentHint")}
          </span>
        </label>

        <label className="form-control">
          <span className="label-text mb-2 font-medium">{t("reservations.form.from")}</span>

          <input
            type="datetime-local"
            className="input input-bordered w-full"
            value={formData.startDate}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                startDate: event.target.value,
              }))
            }
            disabled={loading}
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text mb-2 font-medium">{t("reservations.form.to")}</span>

          <input
            type="datetime-local"
            className="input input-bordered w-full"
            value={formData.endDate}
            min={formData.startDate || undefined}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                endDate: event.target.value,
              }))
            }
            disabled={loading}
            required
          />
        </label>

        <label className="form-control md:col-span-2">
          <span className="label-text mb-2 font-medium">{t("reservations.form.status")}</span>

          <select
            className="select select-bordered w-full"
            value={formData.status}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                status: event.target.value as ReservationFormData["status"],
              }))
            }
            disabled={loading}
          >
            <option value="PENDING">{t("status.PENDING")}</option>
            <option value="CONFIRMED">{t("status.CONFIRMED")}</option>

            {editMode && (
              <>
                <option value="COMPLETED">{t("status.COMPLETED")}</option>
                <option value="CANCELLED">{t("status.CANCELLED")}</option>
              </>
            )}
          </select>
        </label>

        <label className="form-control md:col-span-2">
          <span className="label-text mb-2 font-medium">{t("reservations.form.notes")}</span>

          <textarea
            className="textarea textarea-bordered min-h-28 w-full"
            maxLength={500}
            value={formData.notes}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            disabled={loading}
            placeholder={t("reservations.form.notesPlaceholder")}
          />
        </label>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading && <span className="loading loading-spinner loading-sm" />}

          {editMode ? t("reservations.form.save") : t("reservations.form.create")}
        </button>
      </div>
    </form>
  );
}
