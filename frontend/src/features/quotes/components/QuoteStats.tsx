import {
  FileText,
  FilePenLine,
  Send,
  CircleCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Quote } from "../types/quote.types";

type QuoteStatsProps = {
  quotes: Quote[];
};

export function QuoteStats({ quotes }: QuoteStatsProps) {
  const { t } = useTranslation();

  const stats = [
    {
      key: "total",
      value: quotes.length,
      icon: FileText,
      color: "text-primary bg-primary/10",
    },
    {
      key: "draft",
      value: quotes.filter((quote) => quote.status === "DRAFT").length,
      icon: FilePenLine,
      color: "text-info bg-info/10",
    },
    {
      key: "sent",
      value: quotes.filter((quote) => quote.status === "SENT").length,
      icon: Send,
      color: "text-warning bg-warning/10",
    },
    {
      key: "accepted",
      value: quotes.filter((quote) => quote.status === "ACCEPTED").length,
      icon: CircleCheck,
      color: "text-success bg-success/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.key}
            className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-base-content/60">
                  {t(`quotes.stats.${stat.key}`)}
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
