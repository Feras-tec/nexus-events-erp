import { Building2, UserCheck, UserX } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Customer } from "../../../components/organisms/CustomerTable";

type Props = {
  customers: Customer[];
};

export function CustomerStats({ customers }: Props) {
  const { t } = useTranslation();

  const total = customers.length;
  const active = customers.filter((customer) => customer.isActive).length;
  const inactive = total - active;

  const stats = [
    {
      label: t("customers.stats.total"),
      value: total,
      icon: Building2,
      color: "text-primary",
      background: "bg-primary/10",
    },
    {
      label: t("customers.stats.active"),
      value: active,
      icon: UserCheck,
      color: "text-success",
      background: "bg-success/10",
    },
    {
      label: t("customers.stats.inactive"),
      value: inactive,
      icon: UserX,
      color: "text-warning",
      background: "bg-warning/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-base-content/60">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {stat.value}
                </p>
              </div>

              <div className={`rounded-xl p-3 ${stat.background}`}>
                <Icon size={21} className={stat.color} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
