import { motion, useReducedMotion } from "motion/react";
import {
  CalendarDays,
  UsersRound,
  CalendarCheck2,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";

type DashboardStat = {
  label: string;
  value: string | number;
  description?: string;
  isLoading?: boolean;
  isError?: boolean;
  icon?: LucideIcon;
  to?: string;
};

type DashboardStatsProps = {
  stats: DashboardStat[];
  ariaLabel?: string;
};

const defaultIcons = [
  CalendarDays,
  UsersRound,
  CalendarCheck2,
  ReceiptText,
];

const styles = [
  {
    icon: "bg-indigo-500/10 text-indigo-500",
    accent: "bg-indigo-500",
  },
  {
    icon: "bg-teal-500/10 text-teal-500",
    accent: "bg-teal-500",
  },
  {
    icon: "bg-amber-500/10 text-amber-500",
    accent: "bg-amber-500",
  },
  {
    icon: "bg-violet-500/10 text-violet-500",
    accent: "bg-violet-500",
  },
];

export function DashboardStats({
  stats,
  ariaLabel,
}: DashboardStatsProps) {
  const reduceMotion = useReducedMotion();

  if (stats.length === 0) return null;

  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label={ariaLabel}
    >
      {stats.map((stat, index) => {
        const Icon =
          stat.icon ?? defaultIcons[index % defaultIcons.length];
        const style = styles[index % styles.length];

        return (
          <motion.article
            key={stat.label}
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 14 }
            }
            animate={{ opacity: 1, y: 0 }}
            whileHover={
              reduceMotion ? undefined : { y: -3 }
            }
            transition={{
              duration: reduceMotion ? 0 : 0.3,
              delay: reduceMotion ? 0 : index * 0.06,
            }}
            className="relative overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className={`absolute inset-x-0 top-0 h-0.5 ${style.accent}`}
              aria-hidden="true"
            />

            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-base-content/60">
                {stat.label}
              </p>

              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
              >
                <Icon size={21} strokeWidth={1.8} />
              </span>
            </div>

            {stat.isLoading ? (
              <div
                className="mt-4 h-10 w-20 animate-pulse rounded-lg bg-base-300"
                role="status"
                aria-label="Loading"
              />
            ) : (
              <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">
                {stat.isError ? "—" : stat.value}
              </p>
            )}

            {stat.description && (
              <p className="mt-2 text-sm text-base-content/60">
                {stat.description}
              </p>
            )}
          </motion.article>
        );
      })}
    </section>
  );
}
