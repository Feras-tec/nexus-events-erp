import type { ReactNode } from "react";

type DetailLayoutProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
};

export function DetailLayout({
  title,
  description,
  actions,
  children,
  sidebar,
}: DetailLayoutProps) {
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>

          {description && (
            <p className="mt-1 text-base-content/60">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap gap-2">
            {actions}
          </div>
        )}
      </header>

      <div
        className={
          sidebar
            ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
            : ""
        }
      >
        <main className="min-w-0">{children}</main>

        {sidebar && (
          <aside className="min-w-0">
            {sidebar}
          </aside>
        )}
      </div>
    </section>
  );
}
