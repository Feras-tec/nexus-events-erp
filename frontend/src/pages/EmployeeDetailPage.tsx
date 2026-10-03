import { useState } from "react";
import { useAuth } from "@clerk/react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import { StatusChip } from "../components/atoms/StatusChip";
import { ConfirmDeleteDialog } from "../components/molecules/ConfirmDeleteDialog";
import {
  EmployeeForm,
  type BranchOption,
  type DepartmentOption,
  type EmployeeFormValues,
} from "../components/organisms/EmployeeForm";
import {
  EmploymentPeriodForm,
  type EmploymentPeriodFormData,
} from "../components/organisms/EmploymentPeriodForm";
import { DetailLayout } from "../components/templates/DetailLayout";
import { apiFetch } from "../services/api";

type EmployeeDetail = {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  nationality?: string | null;
  position?: string | null;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "SUSPENDED";

  branch: {
    id: string;
    code: string;
    name: string;
    city: string;
    isActive: boolean;
    company?: {
      id: string;
      name: string;
    };
  };

  department?: {
    id: string;
    name: string;
    branchId: string;
    isActive: boolean;
  } | null;

  employmentPeriods: {
    id: string;
    startDate: string;
    endDate?: string | null;
    position?: string | null;
    reason?: string | null;
    createdAt: string;
    updatedAt: string;
    employeeId: string;
  }[];
  documents: unknown[];
};

type EmployeeResponse = {
  data: EmployeeDetail;
};

type BranchesResponse = {
  data: BranchOption[];
};

type DepartmentsResponse = {
  data: DepartmentOption[];
};

export function EmployeeDetailPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] =
    useState(false);
  const [showEmploymentPeriodForm, setShowEmploymentPeriodForm] =
    useState(false);

  const { employeeId } = useParams({
    from: "/app/employees/$employeeId",
  });

  const {
    data: employee,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["employees", employeeId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/employees/${employeeId}`,
        token,
      );

      const result = (await response.json()) as EmployeeResponse;

      return result.data;
    },
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/branches", token);
      const result = (await response.json()) as BranchesResponse;

      return result.data;
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/departments", token);
      const result = (await response.json()) as DepartmentsResponse;

      return result.data;
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormValues) => {
      const token = await getToken();

      const payload = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim() || undefined,
        phone: data.phone.trim() || undefined,
        birthDate: data.birthDate || undefined,
        nationality: data.nationality.trim() || undefined,
        position: data.position.trim() || undefined,
        departmentId: data.departmentId || undefined,
        status: data.status,
      };

      const response = await apiFetch(
        `/api/employees/${employeeId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["employees", employeeId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["employees"],
        }),
      ]);

      setIsEditing(false);
    },
  });

  const createEmploymentPeriodMutation = useMutation({
    mutationFn: async (data: EmploymentPeriodFormData) => {
      const token = await getToken();

      const payload = {
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        position: data.position.trim() || undefined,
        reason: data.reason.trim() || undefined,
      };

      const response = await apiFetch(
        `/api/employees/${employeeId}/employment-periods`,
        token,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["employees", employeeId],
      });

      setShowEmploymentPeriodForm(false);
    },
  });

  const deactivateEmployeeMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/employees/${employeeId}/deactivate`,
        token,
        {
          method: "PATCH",
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["employees", employeeId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["employees"],
        }),
      ]);

      setShowDeactivateDialog(false);
    },
  });

  const activateEmployeeMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/employees/${employeeId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: "ACTIVE",
          }),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["employees", employeeId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["employees"],
        }),
      ]);
    },
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
              <section className="rounded-box border border-base-300 bg-base-100 p-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">
                    Mitarbeiterdaten
                  </h2>

                  <StatusChip status={employee.status} />
                </div>

                <dl className="grid gap-6 md:grid-cols-2">
                  <div>
                    <dt className="text-sm text-base-content/60">
                      Mitarbeiternr.
                    </dt>
                    <dd className="mt-1 font-medium">
                      {employee.employeeNo}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-base-content/60">
                      Position
                    </dt>
                    <dd className="mt-1 font-medium">
                      {employee.position || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-base-content/60">
                      E-Mail
                    </dt>
                    <dd className="mt-1 font-medium">
                      {employee.email || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-base-content/60">
                      Telefon
                    </dt>
                    <dd className="mt-1 font-medium">
                      {employee.phone || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-base-content/60">
                      Geburtsdatum
                    </dt>
                    <dd className="mt-1 font-medium">
                      {employee.birthDate
                        ? new Date(
                            employee.birthDate,
                          ).toLocaleDateString("de-DE")
                        : "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-base-content/60">
                      Nationalität
                    </dt>
                    <dd className="mt-1 font-medium">
                      {employee.nationality || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-base-content/60">
                      Niederlassung
                    </dt>
                    <dd className="mt-1 font-medium">
                      {employee.branch.name}
                      {employee.branch.city
                        ? ` – ${employee.branch.city}`
                        : ""}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-base-content/60">
                      Abteilung
                    </dt>
                    <dd className="mt-1 font-medium">
                      {employee.department?.name || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-base-content/60">
                      Unternehmen
                    </dt>
                    <dd className="mt-1 font-medium">
                      {employee.branch.company?.name || "—"}
                    </dd>
                  </div>
                </dl>
              </section>

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
                        <div
                          key={period.id}
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

                            {!period.endDate && (
                              <span className="badge badge-success">
                                Aktuell
                              </span>
                            )}
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
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-box border border-base-300 bg-base-100 p-6">
                  <h2 className="text-lg font-semibold">
                    Dokumente
                  </h2>

                  <p className="mt-2 text-sm text-base-content/60">
                    {employee.documents.length} Dokumente
                  </p>
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
