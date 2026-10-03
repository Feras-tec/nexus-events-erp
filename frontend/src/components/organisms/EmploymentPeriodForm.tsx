import { useState, type FormEvent } from "react";

export type EmploymentPeriodFormData = {
  startDate: string;
  endDate: string;
  position: string;
  reason: string;
};

type EmploymentPeriodFormProps = {
  loading?: boolean;
  onSubmit: (data: EmploymentPeriodFormData) => void;
};

const initialValues: EmploymentPeriodFormData = {
  startDate: "",
  endDate: "",
  position: "",
  reason: "",
};

export function EmploymentPeriodForm({
  loading = false,
  onSubmit,
}: EmploymentPeriodFormProps) {
  const [values, setValues] =
    useState<EmploymentPeriodFormData>(initialValues);

  function updateField(
    field: keyof EmploymentPeriodFormData,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      values.endDate &&
      values.endDate < values.startDate
    ) {
      return;
    }

    onSubmit(values);
  }

  const invalidDateRange =
    Boolean(values.startDate) &&
    Boolean(values.endDate) &&
    values.endDate < values.startDate;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-box border border-base-300 bg-base-100 p-6"
    >
      <h3 className="mb-5 text-lg font-semibold">
        Beschäftigungszeitraum hinzufügen
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Von</legend>

          <input
            type="date"
            className="input w-full"
            value={values.startDate}
            onChange={(event) =>
              updateField("startDate", event.target.value)
            }
            disabled={loading}
            required
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Bis</legend>

          <input
            type="date"
            className="input w-full"
            value={values.endDate}
            min={values.startDate || undefined}
            onChange={(event) =>
              updateField("endDate", event.target.value)
            }
            disabled={loading}
          />

          {invalidDateRange && (
            <p className="text-sm text-error">
              Das Enddatum darf nicht vor dem Startdatum liegen.
            </p>
          )}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Position</legend>

          <input
            type="text"
            className="input w-full"
            value={values.position}
            onChange={(event) =>
              updateField("position", event.target.value)
            }
            disabled={loading}
            maxLength={100}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">
            Grund / Bemerkung
          </legend>

          <input
            type="text"
            className="input w-full"
            value={values.reason}
            onChange={(event) =>
              updateField("reason", event.target.value)
            }
            disabled={loading}
            maxLength={255}
          />
        </fieldset>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={
            loading ||
            !values.startDate ||
            invalidDateRange
          }
        >
          {loading
            ? "Wird gespeichert..."
            : "Zeitraum hinzufügen"}
        </button>
      </div>
    </form>
  );
}
