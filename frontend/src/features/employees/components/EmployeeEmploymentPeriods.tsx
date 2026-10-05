import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../../../components/atoms/Button";
import { EmploymentPeriodForm } from "../../../components/organisms/EmploymentPeriodForm";
import type { EmployeeDetail } from "../types/employee.types";
import { useEmployeeEmploymentPeriods } from "../hooks/useEmployeeEmploymentPeriods";

type EmployeeEmploymentPeriodsProps = {
  employee: EmployeeDetail;
};

export function EmployeeEmploymentPeriods({
  employee,
}: EmployeeEmploymentPeriodsProps) {
  const [showEmploymentPeriodForm, setShowEmploymentPeriodForm] =
    useState(false);

  const [
    editingEmploymentPeriodId,
    setEditingEmploymentPeriodId,
  ] = useState<string | null>(null);

  const [
    deletingEmploymentPeriodId,
    setDeletingEmploymentPeriodId,
  ] = useState<string | null>(null);

  const {
    createEmploymentPeriodMutation,
    updateEmploymentPeriodMutation,
    deleteEmploymentPeriodMutation,
  } = useEmployeeEmploymentPeriods({
    employeeId: employee.id,
    onCreateSuccess: () => setShowEmploymentPeriodForm(false),
    onUpdateSuccess: () => setEditingEmploymentPeriodId(null),
    onDeleteSuccess: () => {
      setDeletingEmploymentPeriodId(null);
      setEditingEmploymentPeriodId(null);
    },
  });

  return (
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
            setShowEmploymentPeriodForm((current) => !current)
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
              loading={createEmploymentPeriodMutation.isPending}
              onSubmit={(data) =>
                createEmploymentPeriodMutation.mutate(data)
              }
            />

            {createEmploymentPeriodMutation.isError && (
              <div
                role="alert"
                className="alert alert-error mt-4"
              >
                Beschäftigungszeitraum konnte nicht erstellt werden.
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
                  {new Date(period.startDate).toLocaleDateString(
                    "de-DE",
                  )}
                  {" – "}
                  {period.endDate
                    ? new Date(period.endDate).toLocaleDateString(
                        "de-DE",
                      )
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
                      Beschäftigungszeitraum konnte nicht gelöscht
                      werden.
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
