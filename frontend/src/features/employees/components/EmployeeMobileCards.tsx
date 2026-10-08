import { Building2, BriefcaseBusiness, Mail, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

import { StatusChip } from "../../../components/atoms/StatusChip";
import type { Employee } from "../hooks/useEmployees";

type EmployeeMobileCardsProps = {
  employees: Employee[];
  onView?: (employeeId: string) => void;
};

export function EmployeeMobileCards({
  employees,
  onView,
}: EmployeeMobileCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 md:hidden">
      {employees.map((employee) => (
        <article
          key={employee.id}
          className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm transition-colors hover:border-primary/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold break-words">
                {employee.firstName} {employee.lastName}
              </h3>
              <p className="mt-1 text-xs text-base-content/60">
                {employee.employeeNo}
              </p>
            </div>

            <StatusChip status={employee.status} />
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <BriefcaseBusiness
                size={16}
                className="mt-0.5 shrink-0 text-base-content/50"
              />
              <div className="min-w-0">
                <span className="text-base-content/60">
                  {t("employees.table.position")}:
                </span>{" "}
                {employee.position ?? "—"}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Building2
                size={16}
                className="mt-0.5 shrink-0 text-base-content/50"
              />
              <div className="min-w-0">
                <p>
                  <span className="text-base-content/60">
                    {t("employees.table.department")}:
                  </span>{" "}
                  {employee.department?.name ?? "—"}
                </p>
                <p className="mt-1">
                  <span className="text-base-content/60">
                    {t("employees.table.branch")}:
                  </span>{" "}
                  {employee.branch.name}
                </p>
              </div>
            </div>

            {employee.email && (
              <div className="flex items-start gap-2">
                <Mail
                  size={16}
                  className="mt-0.5 shrink-0 text-base-content/50"
                />
                <span className="min-w-0 break-all">
                  {employee.email}
                </span>
              </div>
            )}
          </div>

          {onView && (
            <button
              type="button"
              className="btn btn-outline btn-sm mt-4 w-full gap-2"
              onClick={() => onView(employee.id)}
            >
              <Eye size={16} />
              {t("common.view")}
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
