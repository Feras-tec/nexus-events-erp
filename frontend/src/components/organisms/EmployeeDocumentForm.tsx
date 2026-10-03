import { useState, type FormEvent } from "react";

export type EmployeeDocumentFormData = {
  type:
    | "RESIDENCE_PERMIT"
    | "WORK_PERMIT"
    | "PASSPORT"
    | "CONTRACT"
    | "OTHER";
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  fileUrl: string;
  notes: string;
};

type EmployeeDocumentFormProps = {
  loading?: boolean;
  initialValues?: EmployeeDocumentFormData;
  mode?: "create" | "edit";
  onSubmit: (data: EmployeeDocumentFormData) => void;
};

const initialValues: EmployeeDocumentFormData = {
  type: "CONTRACT",
  documentNumber: "",
  issueDate: "",
  expiryDate: "",
  fileUrl: "",
  notes: "",
};

export function EmployeeDocumentForm({
  loading = false,
  initialValues: providedInitialValues,
  mode = "create",
  onSubmit,
}: EmployeeDocumentFormProps) {
  const [values, setValues] =
    useState<EmployeeDocumentFormData>(
      providedInitialValues ?? initialValues,
    );

  function updateField(
    field: keyof EmployeeDocumentFormData,
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
      values.issueDate &&
      values.expiryDate &&
      values.expiryDate < values.issueDate
    ) {
      return;
    }

    onSubmit(values);
  }

  const invalidDateRange =
    Boolean(values.issueDate) &&
    Boolean(values.expiryDate) &&
    values.expiryDate < values.issueDate;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-box border border-base-300 bg-base-100 p-6"
    >
      <h3 className="mb-5 text-lg font-semibold">
        {mode === "edit"
          ? "Dokument bearbeiten"
          : "Dokument hinzufügen"}
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Dokumenttyp</legend>

          <select
            className="select w-full"
            value={values.type}
            onChange={(event) =>
              updateField("type", event.target.value)
            }
            disabled={loading}
            required
          >
            <option value="RESIDENCE_PERMIT">
              Aufenthaltstitel
            </option>
            <option value="WORK_PERMIT">
              Arbeitserlaubnis
            </option>
            <option value="PASSPORT">Reisepass</option>
            <option value="CONTRACT">Vertrag</option>
            <option value="OTHER">Sonstiges</option>
          </select>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">
            Dokumentnummer
          </legend>

          <input
            type="text"
            className="input w-full"
            value={values.documentNumber}
            onChange={(event) =>
              updateField("documentNumber", event.target.value)
            }
            disabled={loading}
            maxLength={100}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">
            Ausstellungsdatum
          </legend>

          <input
            type="date"
            className="input w-full"
            value={values.issueDate}
            onChange={(event) =>
              updateField("issueDate", event.target.value)
            }
            disabled={loading}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">
            Ablaufdatum
          </legend>

          <input
            type="date"
            className="input w-full"
            value={values.expiryDate}
            min={values.issueDate || undefined}
            onChange={(event) =>
              updateField("expiryDate", event.target.value)
            }
            disabled={loading}
          />

          {invalidDateRange && (
            <p className="text-sm text-error">
              Das Ablaufdatum darf nicht vor dem
              Ausstellungsdatum liegen.
            </p>
          )}
        </fieldset>

        <fieldset className="fieldset md:col-span-2">
          <legend className="fieldset-legend">Datei-URL</legend>

          <input
            type="url"
            className="input w-full"
            placeholder="https://..."
            value={values.fileUrl}
            onChange={(event) =>
              updateField("fileUrl", event.target.value)
            }
            disabled={loading}
          />
        </fieldset>

        <fieldset className="fieldset md:col-span-2">
          <legend className="fieldset-legend">Notizen</legend>

          <textarea
            className="textarea min-h-24 w-full"
            value={values.notes}
            onChange={(event) =>
              updateField("notes", event.target.value)
            }
            disabled={loading}
            maxLength={500}
          />
        </fieldset>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || invalidDateRange}
        >
          {loading
            ? "Wird gespeichert..."
            : mode === "edit"
              ? "Änderungen speichern"
              : "Dokument hinzufügen"}
        </button>
      </div>
    </form>
  );
}
