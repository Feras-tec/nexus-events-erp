import type { ReactNode } from "react";

type PageSectionProps = {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  tone?: "default" | "danger";
};

export function PageSection({
  icon,
  title,
  description,
  actions,
  children,
  tone = "default",
}: PageSectionProps) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border bg-base-100 shadow-sm ${
        tone === "danger" ? "border-error/30" : "border-base-300"
      }`}
    >
      <header className="flex flex-col gap-2 border-b border-base-300 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                tone === "danger"
                  ? "bg-error/10 text-error"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-bold">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs leading-relaxed text-base-content/55">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
