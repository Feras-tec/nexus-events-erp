import { Package, CheckCircle2, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { InventoryItem } from "../hooks/useEquipment";

type Props = {
  equipment: InventoryItem[];
};

export function EquipmentStats({ equipment }: Props) {
  const { t } = useTranslation();

  const total = equipment.length;

  const available = equipment.filter(
    (item) => item.status === "AVAILABLE"
  ).length;

  const needsAttention = equipment.filter((item) =>
    ["DAMAGED", "MAINTENANCE", "LOST"].includes(item.status)
  ).length;

  const stats = [
    {
      label: t("equipment.stats.total"),
      value: total,
      icon: Package,
      color: "text-primary",
      background: "bg-primary/10",
    },
    {
      label: t("equipment.stats.available"),
      value: available,
      icon: CheckCircle2,
      color: "text-success",
      background: "bg-success/10",
    },
    {
      label: t("equipment.stats.needsAttention"),
      value: needsAttention,
      icon: Wrench,
      color: "text-warning",
      background: "bg-warning/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <p className="text-sm text-base-content/60">
                  {stat.label}
                </p>

                <p className="text-3xl font-bold tabular-nums">
                  {stat.value}
                </p>
              </div>

              <div className={`rounded-xl p-3 ${stat.background}`}>
                <Icon size={22} className={stat.color} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
