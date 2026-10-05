import { AnimatePresence, motion } from "motion/react";

import { EmployeeDocumentForm } from "../../../components/organisms/EmployeeDocumentForm";
import type { EmployeeDocumentFormData } from "../../../components/organisms/EmployeeDocumentForm";

type EmployeeDocument = {
  id: string;
  type:
    | "RESIDENCE_PERMIT"
    | "WORK_PERMIT"
    | "PASSPORT"
    | "CONTRACT"
    | "OTHER";
  documentNumber?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  fileUrl?: string | null;
  notes?: string | null;
};

type EmployeeDocumentItemProps = {
  document: EmployeeDocument;
  typeLabel: string;
  editing: boolean;
  deleting: boolean;
  updateLoading: boolean;
  updateError: boolean;
  deleteLoading: boolean;
  deleteError: boolean;
  onToggleEdit: () => void;
  onDeleteRequest: () => void;
  onCancelDelete: () => void;
  onUpdate: (data: EmployeeDocumentFormData) => void;
  onDelete: () => void;
};

export function EmployeeDocumentItem({
  document,
  typeLabel,
  editing,
  deleting,
  updateLoading,
  updateError,
  deleteLoading,
  deleteError,
  onToggleEdit,
  onDeleteRequest,
  onCancelDelete,
  onUpdate,
  onDelete,
}: EmployeeDocumentItemProps) {
  return (
    <motion.div
      layout
      className="rounded-box border border-base-300 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{typeLabel}</p>

          {document.documentNumber && (
            <p className="mt-1 text-sm text-base-content/60">
              Nr. {document.documentNumber}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {document.fileUrl && (
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-xs"
            >
              Datei öffnen
            </a>
          )}

          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={onToggleEdit}
          >
            {editing ? "Abbrechen" : "Bearbeiten"}
          </button>

          <button
            type="button"
            className="btn btn-error btn-outline btn-xs"
            onClick={onDeleteRequest}
          >
            Löschen
          </button>
        </div>
      </div>

      {(document.issueDate || document.expiryDate) && (
        <div className="mt-3 text-sm">
          {document.issueDate && (
            <p>
              <span className="text-base-content/60">
                Ausgestellt:
              </span>{" "}
              {new Date(
                document.issueDate,
              ).toLocaleDateString("de-DE")}
            </p>
          )}

          {document.expiryDate && (
            <p>
              <span className="text-base-content/60">
                Gültig bis:
              </span>{" "}
              {new Date(
                document.expiryDate,
              ).toLocaleDateString("de-DE")}
            </p>
          )}
        </div>
      )}

      {document.notes && (
        <p className="mt-3 text-sm text-base-content/70">
          {document.notes}
        </p>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            <EmployeeDocumentForm
              key={document.id}
              mode="edit"
              initialValues={{
                type: document.type,
                documentNumber:
                  document.documentNumber || "",
                issueDate: document.issueDate
                  ? document.issueDate.slice(0, 10)
                  : "",
                expiryDate: document.expiryDate
                  ? document.expiryDate.slice(0, 10)
                  : "",
                fileUrl: document.fileUrl || "",
                notes: document.notes || "",
              }}
              loading={updateLoading}
              onSubmit={onUpdate}
            />

            {updateError && (
              <div
                role="alert"
                className="alert alert-error mt-4"
              >
                Dokument konnte nicht aktualisiert werden.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {deleting && (
        <div className="mt-4 rounded-box border border-error/30 bg-error/5 p-4">
          <p className="text-sm font-medium">
            Dokument wirklich löschen?
          </p>

          <p className="mt-1 text-sm text-base-content/60">
            Dieser Vorgang kann nicht rückgängig gemacht werden.
          </p>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={deleteLoading}
              onClick={onCancelDelete}
            >
              Abbrechen
            </button>

            <button
              type="button"
              className="btn btn-error btn-sm"
              disabled={deleteLoading}
              onClick={onDelete}
            >
              {deleteLoading
                ? "Wird gelöscht..."
                : "Endgültig löschen"}
            </button>
          </div>

          {deleteError && (
            <div
              role="alert"
              className="alert alert-error mt-3"
            >
              Dokument konnte nicht gelöscht werden.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
