import { Boxes, Package, PackageCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ProductTableItem } from "../../../components/organisms/ProductTable";

type Props = {
  products: ProductTableItem[];
};

export function ProductStats({ products }: Props) {
  const { i18n } = useTranslation();

  const language = i18n.resolvedLanguage ?? i18n.language;

  const labels = language.startsWith("ar")
    ? ["إجمالي المنتجات", "المنتجات النشطة", "الأجهزة المرتبطة"]
    : language.startsWith("de")
      ? ["Alle Produkte", "Aktive Produkte", "Zugehörige Geräte"]
      : ["Total products", "Active products", "Linked equipment"];

  const total = products.length;

  const active = products.filter(
    (product) => product.isActive
  ).length;

  const devices = products.reduce(
    (sum, product) => sum + (product.inventoryItems?.length ?? 0),
    0
  );

  const stats = [
    {
      label: labels[0],
      value: total,
      icon: Package,
      color: "text-primary",
      background: "bg-primary/10",
    },
    {
      label: labels[1],
      value: active,
      icon: PackageCheck,
      color: "text-success",
      background: "bg-success/10",
    },
    {
      label: labels[2],
      value: devices,
      icon: Boxes,
      color: "text-info",
      background: "bg-info/10",
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
