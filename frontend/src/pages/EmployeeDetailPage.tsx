import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { Button } from "../components/atoms/Button";
import { ConfirmDeleteDialog } from "../components/molecules/ConfirmDeleteDialog";
import {
  EmployeeForm,
  type EmployeeFormValues,
} from "../components/organisms/EmployeeForm";
import { DetailLayout } from "../components/templates/DetailLayout";
import { useEmployeeDetail } from "../features/employees/hooks/useEmployeeDetail";
import { useEmployeeOptions } from "../features/employees/hooks/useEmployeeOptions";
import { useUpdateEmployee } from "../features/employees/hooks/useUpdateEmployee";
import { useEmployeeStatus } from "../features/employees/hooks/useEmployeeStatus";
import { EmployeeOverview } from "../features/employees/components/EmployeeOverview";
import { EmployeeEmploymentPeriods } from "../features/employees/components/EmployeeEmploymentPeriods";
import { EmployeeDocuments } from "../features/employees/components/EmployeeDocuments";

export function EmployeeDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] =
    useState(false);

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
          aria-label={t("employees.detail.loading")}
        />
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div role="alert" className="alert alert-error">
        {t("employees.detail.loadError")}
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
              ← {t("common.back")}
            </Button>

            <Button
              type="button"
              onClick={() =>
                setIsEditing((current) => !current)
              }
            >
              {isEditing
                ? t("common.cancel")
                : t("common.edit")}
            </Button>

            {employee.status !== "INACTIVE" && !isEditing && (
              <Button
                type="button"
                variant="error"
                onClick={() =>
                  setShowDeactivateDialog(true)
                }
              >
                {t("employees.detail.deactivate")}
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
                  ? t("employees.detail.activating")
                  : t("employees.detail.activate")}
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
                  {t("employees.detail.updateError")}
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
                <EmployeeEmploymentPeriods employee={employee} />
                <EmployeeDocuments employee={employee} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activateEmployeeMutation.isError && (
          <div role="alert" className="alert alert-error mt-4">
            {t("employees.detail.activateError")}
          </div>
        )}

        <ConfirmDeleteDialog
          open={showDeactivateDialog}
          title={t("employees.detail.deactivateTitle")}
          message={t("employees.detail.deactivateMessage", {
            name: fullName,
          })}
          confirmLabel={t("employees.detail.deactivate")}
          cancelLabel={t("common.cancel")}
          loading={deactivateEmployeeMutation.isPending}
          onCancel={() => setShowDeactivateDialog(false)}
          onConfirm={() => deactivateEmployeeMutation.mutate()}
        />
      </DetailLayout>
    </motion.div>
  );
}
