import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import { ConfirmDeleteDialog } from "../components/molecules/ConfirmDeleteDialog";
import {
  EmployeeForm,
  type EmployeeFormValues,
} from "../components/organisms/EmployeeForm";
import { EmploymentPeriodForm } from "../components/organisms/EmploymentPeriodForm";
import { EmployeeDocumentForm } from "../components/organisms/EmployeeDocumentForm";
import { DetailLayout } from "../components/templates/DetailLayout";
import { useEmployeeDetail } from "../features/employees/hooks/useEmployeeDetail";
import { useEmployeeOptions } from "../features/employees/hooks/useEmployeeOptions";
import { useUpdateEmployee } from "../features/employees/hooks/useUpdateEmployee";
import { useEmployeeDocuments } from "../features/employees/hooks/useEmployeeDocuments";
import { useEmployeeEmploymentPeriods } from "../features/employees/hooks/useEmployeeEmploymentPeriods";
import { useEmployeeStatus } from "../features/employees/hooks/useEmployeeStatus";
import { EmployeeOverview } from "../features/employees/components/EmployeeOverview";


export function EmployeeDetailPage() {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] =
    useState(false);
  const [showEmploymentPeriodForm, setShowEmploymentPeriodForm] =
    useState(false);
  const [showDocumentForm, setShowDocumentForm] =
    useState(false);
  const [editingDocumentId, setEditingDocumentId] =
    useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] =
    useState<string | null>(null);
  const [editingEmploymentPeriodId, setEditingEmploymentPeriodId] =
    useState<string | null>(null);
  const [deletingEmploymentPeriodId, setDeletingEmploymentPeriodId] =
    useState<string | null>(null);

  const { employeeId } = useParams({
    from: "/app/employees/$employeeId",
  });

  const {
    data: employee,
    isLoading,
    isError,
  } = useEmployeeDetail(employeeId);

  const {
    branches,
    departments,
  } = useEmployeeOptions();

  const { updateEmployeeMutation } = useUpdateEmployee({
    employeeId,
    onSuccess: () => setIsEditing(false),
  });

  const {
    createEmployeeDocumentMutation,
    updateEmployeeDocumentMutation,
    deleteEmployeeDocumentMutation,
  } = useEmployeeDocuments({
    employeeId,
    onCreateSuccess: () => setShowDocumentForm(false),
    onUpdateSuccess: () => setEditingDocumentId(null),
    onDeleteSuccess: () => {
      setDeletingDocumentId(null);
      setEditingDocumentId(null);
    },
  });

  const {
    createEmploymentPeriodMutation,
    updateEmploymentPeriodMutation,
    deleteEmploymentPeriodMutation,
  } = useEmployeeEmploymentPeriods({
    employeeId,
    onCreateSuccess: () => setShowEmploymentPeriodForm(false),
    onUpdateSuccess: () => setEditingEmploymentPeriodId(null),
    onDeleteSuccess: () => {
      setDeletingEmploymentPeriodId(null);
      setEditingEmploymentPeriodId(null);
    },
  });

  const {
    deactivateEmployeeMutation,
    activateEmployeeMutation,
  } = useEmployeeStatus({
    employeeId,
    onDeactivateSuccess: () => setShowDeactivateDialog(false),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span
          className="loading loading-spinner loading-lg"
          aria-label="Mitarbeiter wird geladen"
        />
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div role="alert" className="alert alert-error">
        Mitarbeiter konnte nicht geladen werden.
      </div>
    );
  }

  const initialValues: EmployeeFormValues = {
    employeeNo: employee.employeeNo,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email || "",
    phone: employee.phone || "",
    birthDate: employee.birthDate
      ? employee.birthDate.slice(0, 10)
      : "",
    nationality: employee.nationality || "",
    position: employee.position || "",
    branchId: employee.branch.id,
    departmentId: employee.department?.id || "",
    status: employee.status,
  };

  const fullName =
    `${employee.firstName} ${employee.lastName}`.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <DetailLayout
        title={fullName}
        description={employee.employeeNo}
        actions={
          <>
            <Button
              type="button"
              className="btn-outline"
              onClick={() => navigate({ to: "/employees" })}
            >
              ← Zurück
            </Button>

            <Button
              type="button"
              onClick={() =>
                setIsEditing((current) => !current)
              }
            >
              {isEditing ? "Abbrechen" : "Bearbeiten"}
            </Button>

            {employee.status !== "INACTIVE" && !isEditing && (
              <Button
                type="button"
                variant="error"
                onClick={() =>
                  setShowDeactivateDialog(true)
                }
              >
                Deaktivieren
              </Button>
            )}

            {employee.status === "INACTIVE" && !isEditing && (
              <Button
                type="button"
                onClick={() =>
                  activateEmployeeMutation.mutate()
                }
                disabled={activateEmployeeMutation.isPending}
              >
                {activateEmployeeMutation.isPending
                  ? "Wird aktiviert..."
                  : "Aktivieren"}
              </Button>
            )}
          </>
        }
      >
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <EmployeeForm
                mode="edit"
                branches={branches}
                departments={departments}
                initialValues={initialValues}
                loading={updateEmployeeMutation.isPending}
                onSubmit={(data) =>
                  updateEmployeeMutation.mutate(data)
                }
              />

              {updateEmployeeMutation.isError && (
                <div
                  role="alert"
                  className="alert alert-error mt-4"
                >
                  Mitarbeiter konnte nicht aktualisiert werden.
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <EmployeeOverview employee={employee} />

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-box border border-base-300 bg-base-100 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Beschäftigungszeiträume
                      </h2>

                      <p className="mt-1 text-sm text-base-content/60">
                        {employee.employmentPeriods.length} Einträge
                      </p>
                    </div>

                    <Button
                      type="button"
                      className="btn-sm"
                      onClick={() =>
                        setShowEmploymentPeriodForm(
                          (current) => !current,
                        )
                      }
                    >
                      {showEmploymentPeriodForm
                        ? "Abbrechen"
                        : "Zeitraum hinzufügen"}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {showEmploymentPeriodForm && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="mt-5"
                      >
                        <EmploymentPeriodForm
                          loading={
                            createEmploymentPeriodMutation.isPending
                          }
                          onSubmit={(data) =>
                            createEmploymentPeriodMutation.mutate(
                              data,
                            )
                          }
                        />

                        {createEmploymentPeriodMutation.isError && (
                          <div
                            role="alert"
                            className="alert alert-error mt-4"
                          >
                            Beschäftigungszeitraum konnte nicht
                            erstellt werden.
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {employee.employmentPeriods.length === 0 ? (
                    <p className="mt-5 text-sm text-base-content/60">
                      Noch keine Beschäftigungszeiträume vorhanden.
                    </p>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {employee.employmentPeriods.map((period) => (
                        <motion.div
                          key={period.id}
                          layout
                          className="rounded-box border border-base-300 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">
                                {period.position ||
                                  employee.position ||
                                  "Beschäftigung"}
                              </p>

                              {period.reason && (
                                <p className="mt-1 text-sm text-base-content/60">
                                  {period.reason}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {!period.endDate && (
                                <span className="badge badge-success">
                                  Aktuell
                                </span>
                              )}

                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => {
                                  setEditingEmploymentPeriodId(
                                    editingEmploymentPeriodId === period.id
                                      ? null
                                      : period.id,
                                  );
                                  setShowEmploymentPeriodForm(false);
                                }}
                              >
                                {editingEmploymentPeriodId === period.id
                                  ? "Abbrechen"
                                  : "Bearbeiten"}
                              </button>

                              <button
                                type="button"
                                className="btn btn-error btn-outline btn-xs"
                                onClick={() =>
                                  setDeletingEmploymentPeriodId(period.id)
                                }
                              >
                                Löschen
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 text-sm">
                            <span className="text-base-content/60">
                              Zeitraum:
                            </span>{" "}
                            <span className="font-medium">
                              {new Date(
                                period.startDate,
                              ).toLocaleDateString("de-DE")}
                              {" – "}
                              {period.endDate
                                ? new Date(
                                    period.endDate,
                                  ).toLocaleDateString("de-DE")
                                : "heute"}
                            </span>
                          </div>

                          <AnimatePresence>
                            {editingEmploymentPeriodId === period.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="mt-4"
                              >
                                <EmploymentPeriodForm
                                  key={period.id}
                                  mode="edit"
                                  initialValues={{
                                    startDate: period.startDate.slice(0, 10),
                                    endDate: period.endDate
                                      ? period.endDate.slice(0, 10)
                                      : "",
                                    position: period.position || "",
                                    reason: period.reason || "",
                                  }}
                                  loading={
                                    updateEmploymentPeriodMutation.isPending
                                  }
                                  onSubmit={(data) =>
                                    updateEmploymentPeriodMutation.mutate({
                                      periodId: period.id,
                                      data,
                                    })
                                  }
                                />

                                {updateEmploymentPeriodMutation.isError && (
                                  <div
                                    role="alert"
                                    className="alert alert-error mt-4"
                                  >
                                    Beschäftigungszeitraum konnte nicht
                                    aktualisiert werden.
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {deletingEmploymentPeriodId === period.id && (
                            <div className="mt-4 rounded-box border border-error/30 bg-error/5 p-4">
                              <p className="text-sm font-medium">
                                Beschäftigungszeitraum wirklich löschen?
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
                                    deleteEmploymentPeriodMutation.isPending
                                  }
                                  onClick={() =>
                                    setDeletingEmploymentPeriodId(null)
                                  }
                                >
                                  Abbrechen
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-error btn-sm"
                                  disabled={
                                    deleteEmploymentPeriodMutation.isPending
                                  }
                                  onClick={() =>
                                    deleteEmploymentPeriodMutation.mutate(
                                      period.id,
                                    )
                                  }
                                >
                                  {deleteEmploymentPeriodMutation.isPending
                                    ? "Wird gelöscht..."
                                    : "Endgültig löschen"}
                                </button>
                              </div>

                              {deleteEmploymentPeriodMutation.isError && (
                                <div
                                  role="alert"
                                  className="alert alert-error mt-3"
                                >
                                  Beschäftigungszeitraum konnte nicht
                                  gelöscht werden.
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>

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
                        setShowDocumentForm(
                          (current) => !current,
                        )
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
                          loading={
                            createEmployeeDocumentMutation.isPending
                          }
                          onSubmit={(data) =>
                            createEmployeeDocumentMutation.mutate(
                              data,
                            )
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
                      {employee.documents.map((document) => {
                        const typeLabels = {
                          RESIDENCE_PERMIT: "Aufenthaltstitel",
                          WORK_PERMIT: "Arbeitserlaubnis",
                          PASSPORT: "Reisepass",
                          CONTRACT: "Vertrag",
                          OTHER: "Sonstiges",
                        };

                        return (
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

                            {(document.issueDate ||
                              document.expiryDate) && (
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
                                      Dokument konnte nicht aktualisiert
                                      werden.
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
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activateEmployeeMutation.isError && (
          <div role="alert" className="alert alert-error mt-4">
            Mitarbeiter konnte nicht aktiviert werden.
          </div>
        )}

        <ConfirmDeleteDialog
          open={showDeactivateDialog}
          title="Mitarbeiter deaktivieren?"
          message={`${fullName} wird deaktiviert, aber nicht endgültig gelöscht.`}
          confirmLabel="Deaktivieren"
          loading={deactivateEmployeeMutation.isPending}
          onCancel={() => setShowDeactivateDialog(false)}
          onConfirm={() => deactivateEmployeeMutation.mutate()}
        />
      </DetailLayout>
    </motion.div>
  );
}
