import { AnimatePresence, motion } from "motion/react";

import {
  EmploymentPeriodForm,
  type EmploymentPeriodFormData,
} from "../../../components/organisms/EmploymentPeriodForm";

type EmploymentPeriod = {
  id: string;
  startDate: string;
  endDate?: string | null;
  position?: string | null;
  reason?: string | null;
};

type EmployeeEmploymentPeriodItemProps = {
  period: EmploymentPeriod;
  employeePosition?: string | null;
  editing: boolean;
  deleting: boolean;
  updateLoading: boolean;
  updateError: boolean;
  deleteLoading: boolean;
  deleteError: boolean;
  onToggleEdit: () => void;
  onDeleteRequest: () => void;
  onCancelDelete: () => void;
  onUpdate: (data: EmploymentPeriodFormData) => void;
  onDelete: () => void;
};

export function EmployeeEmploymentPeriodItem({
  period,
  employeePosition,
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
}: EmployeeEmploymentPeriodItemProps) {
  return (
    <motion.div
      layout
      className="rounded-box border border-base-300 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">
            {period.position ||
              employeePosition ||
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
        {editing && (
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
              loading={updateLoading}
              onSubmit={onUpdate}
            />

            {updateError && (
              <div
                role="alert"
                className="alert alert-error mt-4"
              >
                Beschäftigungszeitraum konnte nicht aktualisiert werden.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {deleting && (
        <div className="mt-4 rounded-box border border-error/30 bg-error/5 p-4">
          <p className="text-sm font-medium">
            Beschäftigungszeitraum wirklich löschen?
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
              Beschäftigungszeitraum konnte nicht gelöscht werden.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
