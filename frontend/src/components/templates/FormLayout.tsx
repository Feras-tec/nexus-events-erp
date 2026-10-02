import type { ReactNode } from "react";

type FormLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function FormLayout({
  title,
  description,
  children,
  actions,
}: FormLayoutProps) {
  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

      <div>{children}</div>
    </section>
  );
}
