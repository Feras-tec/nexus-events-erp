import { useTranslation } from "react-i18next";

import { StatusChip } from "../../../components/atoms/StatusChip";
import type { EmployeeDetail } from "../types/employee.types";

type EmployeeOverviewProps = {
  employee: EmployeeDetail;
};

export function EmployeeOverview({
  employee,
}: EmployeeOverviewProps) {
  const { t, i18n } = useTranslation();

  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {t("employees.detail.employeeData")}
        </h2>

        <StatusChip status={employee.status} />
      </div>

      <dl className="grid gap-6 md:grid-cols-2">
        <div>
          <dt className="text-sm text-base-content/60">
            {t("employees.form.employeeNo")}
          </dt>
          <dd className="mt-1 font-medium">
            {employee.employeeNo}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">
            {t("employees.form.position")}
          </dt>
          <dd className="mt-1 font-medium">
            {employee.position || "—"}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">
            {t("employees.form.email")}
          </dt>
          <dd className="mt-1 font-medium">
            {employee.email || "—"}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">
            {t("employees.form.phone")}
          </dt>
          <dd className="mt-1 font-medium">
            {employee.phone || "—"}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">
            {t("employees.form.birthDate")}
          </dt>
          <dd className="mt-1 font-medium">
            {employee.birthDate
              ? new Date(employee.birthDate).toLocaleDateString(
                  i18n.language === "ar"
                    ? "ar-SA"
                    : i18n.language === "en"
                      ? "en-US"
                      : "de-DE",
                )
              : "—"}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">
            {t("employees.form.nationality")}
          </dt>
          <dd className="mt-1 font-medium">
            {employee.nationality || "—"}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">
            {t("employees.form.branch")}
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
            {t("employees.form.department")}
          </dt>
          <dd className="mt-1 font-medium">
            {employee.department?.name || "—"}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">
            {t("employees.detail.company")}
          </dt>
          <dd className="mt-1 font-medium">
            {employee.branch.company?.name || "—"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
