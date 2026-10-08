import { useTranslation } from "react-i18next";
import { Users, UserCheck, UserRoundX } from "lucide-react";

type EmployeeStatus = {
  status: string;
};

type Props = {
  employees: EmployeeStatus[];
};

export function EmployeeStats({ employees }: Props) {
  const { t } = useTranslation();

  const stats = [
    {
      label: t("employees.stats.total"),
      value: employees.length,
      icon: Users,
      color: "text-primary bg-primary/10",
    },
    {
      label: t("employees.stats.active"),
      value: employees.filter(
        (employee) => employee.status === "ACTIVE"
      ).length,
      icon: UserCheck,
      color: "text-success bg-success/10",
    },
    {
      label: t("employees.stats.unavailable"),
      value: employees.filter(
        (employee) => employee.status !== "ACTIVE"
      ).length,
      icon: UserRoundX,
      color: "text-warning bg-warning/10",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-base-content/60">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {stat.value}
                </p>
              </div>

              <div className={`rounded-xl p-3 ${stat.color}`}>
                <Icon size={22} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
