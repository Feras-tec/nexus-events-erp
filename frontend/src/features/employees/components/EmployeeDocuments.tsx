import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../../../components/atoms/Button";
import { EmployeeDocumentForm } from "../../../components/organisms/EmployeeDocumentForm";
import { useEmployeeDocuments } from "../hooks/useEmployeeDocuments";
import type { EmployeeDetail } from "../types/employee.types";

type EmployeeDocumentsProps = {
  employee: EmployeeDetail;
};

const typeLabels = {
  RESIDENCE_PERMIT: "Aufenthaltstitel",
  WORK_PERMIT: "Arbeitserlaubnis",
  PASSPORT: "Reisepass",
  CONTRACT: "Vertrag",
  OTHER: "Sonstiges",
};

export function EmployeeDocuments({
  employee,
}: EmployeeDocumentsProps) {
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [editingDocumentId, setEditingDocumentId] =
    useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] =
    useState<string | null>(null);

  const {
    createEmployeeDocumentMutation,
    updateEmployeeDocumentMutation,
    deleteEmployeeDocumentMutation,
  } = useEmployeeDocuments({
    employeeId: employee.id,
    onCreateSuccess: () => setShowDocumentForm(false),
    onUpdateSuccess: () => setEditingDocumentId(null),
    onDeleteSuccess: () => {
      setDeletingDocumentId(null);
      setEditingDocumentId(null);
    },
  });

  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Dokumente
          </h2>

          <p className="mt-1 text-sm text-base-content/60">
            {employee.documents.length} Dokumente
          </p>
        </div>

        <Button
          type="button"
          className="btn-sm"
          onClick={() =>
            setShowDocumentForm((current) => !current)
          }
        >
          {showDocumentForm
            ? "Abbrechen"
            : "Dokument hinzufügen"}
        </Button>
      </div>

      <AnimatePresence>
        {showDocumentForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-5"
          >
            <EmployeeDocumentForm
              loading={createEmployeeDocumentMutation.isPending}
              onSubmit={(data) =>
                createEmployeeDocumentMutation.mutate(data)
              }
            />

            {createEmployeeDocumentMutation.isError && (
              <div
                role="alert"
                className="alert alert-error mt-4"
              >
                Dokument konnte nicht erstellt werden.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {employee.documents.length === 0 ? (
        <p className="mt-5 text-sm text-base-content/60">
          Noch keine Dokumente vorhanden.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {employee.documents.map((document) => (
            <motion.div
              key={document.id}
              layout
              className="rounded-box border border-base-300 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {typeLabels[document.type]}
                  </p>

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
                    onClick={() => {
                      setEditingDocumentId(
                        editingDocumentId === document.id
                          ? null
                          : document.id,
                      );
                      setShowDocumentForm(false);
                    }}
                  >
                    {editingDocumentId === document.id
                      ? "Abbrechen"
                      : "Bearbeiten"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-error btn-outline btn-xs"
                    onClick={() =>
                      setDeletingDocumentId(document.id)
                    }
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
                {editingDocumentId === document.id && (
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
                      loading={
                        updateEmployeeDocumentMutation.isPending
                      }
                      onSubmit={(data) =>
                        updateEmployeeDocumentMutation.mutate({
                          documentId: document.id,
                          data,
                        })
                      }
                    />

                    {updateEmployeeDocumentMutation.isError && (
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

              {deletingDocumentId === document.id && (
                <div className="mt-4 rounded-box border border-error/30 bg-error/5 p-4">
                  <p className="text-sm font-medium">
                    Dokument wirklich löschen?
                  </p>

                  <p className="mt-1 text-sm text-base-content/60">
                    Dieser Vorgang kann nicht rückgängig gemacht
                    werden.
                  </p>

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={
                        deleteEmployeeDocumentMutation.isPending
                      }
                      onClick={() =>
                        setDeletingDocumentId(null)
                      }
                    >
                      Abbrechen
                    </button>

                    <button
                      type="button"
                      className="btn btn-error btn-sm"
                      disabled={
                        deleteEmployeeDocumentMutation.isPending
                      }
                      onClick={() =>
                        deleteEmployeeDocumentMutation.mutate(
                          document.id,
                        )
                      }
                    >
                      {deleteEmployeeDocumentMutation.isPending
                        ? "Wird gelöscht..."
                        : "Endgültig löschen"}
                    </button>
                  </div>

                  {deleteEmployeeDocumentMutation.isError && (
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
          ))}
        </div>
      )}
    </section>
  );
}
