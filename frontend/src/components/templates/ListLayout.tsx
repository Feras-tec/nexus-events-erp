import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { SearchBox } from "../molecules/SearchBox";

type ListLayoutProps = {
  title: string;
  description?: string;
  searchValue: string;
  searchPlaceholder?: string;
  onSearchChange: (value: string) => void;
  actions?: ReactNode;
  children: ReactNode;
};

export function ListLayout({
  title,
  description,
  searchValue,
  searchPlaceholder = "Suchen...",
  onSearchChange,
  actions,
  children,
}: ListLayoutProps) {
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

          <Link
            to="/dashboard"
            className="btn btn-ghost btn-sm mt-3 -ml-3"
          >
            ← Zum Dashboard
          </Link>
        </div>

        {actions && (
          <div className="flex flex-wrap gap-2">
            {actions}
          </div>
        )}
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBox
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
      </div>

      <div>{children}</div>
    </section>
  );
}
