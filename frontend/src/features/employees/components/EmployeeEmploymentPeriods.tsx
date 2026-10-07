import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../components/atoms/Button";
import { EmployeeEmploymentPeriodCreatePanel } from "./EmployeeEmploymentPeriodCreatePanel";
import { EmployeeEmploymentPeriodItem } from "./EmployeeEmploymentPeriodItem";
import type { EmployeeDetail } from "../types/employee.types";
import { useEmployeeEmploymentPeriods } from "../hooks/useEmployeeEmploymentPeriods";

type EmployeeEmploymentPeriodsProps = {
  employee: EmployeeDetail;
};

export function EmployeeEmploymentPeriods({
  employee,
}: EmployeeEmploymentPeriodsProps) {
  const { t } = useTranslation();

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
            {t("employees.employment.title")}
          </h2>

          <p className="mt-1 text-sm text-base-content/60">
            {t("employees.employment.entries", {
              count: employee.employmentPeriods.length,
            })}
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
            ? t("common.cancel")
            : t("employees.employment.add")}
        </Button>
      </div>

      <EmployeeEmploymentPeriodCreatePanel
        open={showEmploymentPeriodForm}
        loading={createEmploymentPeriodMutation.isPending}
        error={createEmploymentPeriodMutation.isError}
        onSubmit={(data) =>
          createEmploymentPeriodMutation.mutate(data)
        }
      />

      {employee.employmentPeriods.length === 0 ? (
        <p className="mt-5 text-sm text-base-content/60">
          {t("employees.employment.empty")}
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {employee.employmentPeriods.map((period) => (
            <EmployeeEmploymentPeriodItem
              key={period.id}
              period={period}
              employeePosition={employee.position}
              editing={
                editingEmploymentPeriodId === period.id
              }
              deleting={
                deletingEmploymentPeriodId === period.id
              }
              updateLoading={
                updateEmploymentPeriodMutation.isPending
              }
              updateError={
                updateEmploymentPeriodMutation.isError
              }
              deleteLoading={
                deleteEmploymentPeriodMutation.isPending
              }
              deleteError={
                deleteEmploymentPeriodMutation.isError
              }
              onToggleEdit={() => {
                setEditingEmploymentPeriodId(
                  editingEmploymentPeriodId === period.id
                    ? null
                    : period.id,
                );
                setShowEmploymentPeriodForm(false);
              }}
              onDeleteRequest={() =>
                setDeletingEmploymentPeriodId(period.id)
              }
              onCancelDelete={() =>
                setDeletingEmploymentPeriodId(null)
              }
              onUpdate={(data) =>
                updateEmploymentPeriodMutation.mutate({
                  periodId: period.id,
                  data,
                })
              }
              onDelete={() =>
                deleteEmploymentPeriodMutation.mutate(
                  period.id,
                )
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
