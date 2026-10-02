type DashboardStat = {
  label: string;
  value: string | number;
  description?: string;
};

type DashboardStatsProps = {
  stats: DashboardStat[];
};

export function DashboardStats({
  stats,
}: DashboardStatsProps) {
  if (stats.length === 0) {
    return null;
  }

  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Dashboard-Statistiken"
    >
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-base-content/60">
            {stat.label}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {stat.value}
          </p>

          {stat.description && (
            <p className="mt-2 text-sm text-base-content/60">
              {stat.description}
            </p>
          )}
        </article>
      ))}
    </section>
  );
}
