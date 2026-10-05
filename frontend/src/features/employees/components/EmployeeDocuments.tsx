import { useState } from "react";

import { Button } from "../../../components/atoms/Button";
import { EmployeeDocumentCreatePanel } from "./EmployeeDocumentCreatePanel";
import { EmployeeDocumentItem } from "./EmployeeDocumentItem";
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

      <EmployeeDocumentCreatePanel
        open={showDocumentForm}
        loading={createEmployeeDocumentMutation.isPending}
        error={createEmployeeDocumentMutation.isError}
        onSubmit={(data) =>
          createEmployeeDocumentMutation.mutate(data)
        }
      />

      {employee.documents.length === 0 ? (
        <p className="mt-5 text-sm text-base-content/60">
          Noch keine Dokumente vorhanden.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {employee.documents.map((document) => (
            <EmployeeDocumentItem
              key={document.id}
              document={document}
              typeLabel={typeLabels[document.type]}
              editing={editingDocumentId === document.id}
              deleting={deletingDocumentId === document.id}
              updateLoading={
                updateEmployeeDocumentMutation.isPending
              }
              updateError={
                updateEmployeeDocumentMutation.isError
              }
              deleteLoading={
                deleteEmployeeDocumentMutation.isPending
              }
              deleteError={
                deleteEmployeeDocumentMutation.isError
              }
              onToggleEdit={() => {
                setEditingDocumentId(
                  editingDocumentId === document.id
                    ? null
                    : document.id,
                );
                setShowDocumentForm(false);
              }}
              onDeleteRequest={() =>
                setDeletingDocumentId(document.id)
              }
              onCancelDelete={() =>
                setDeletingDocumentId(null)
              }
              onUpdate={(data) =>
                updateEmployeeDocumentMutation.mutate({
                  documentId: document.id,
                  data,
                })
              }
              onDelete={() =>
                deleteEmployeeDocumentMutation.mutate(
                  document.id,
                )
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
