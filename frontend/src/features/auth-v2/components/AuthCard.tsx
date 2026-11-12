import type { ReactNode } from "react";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-xl shadow-base-300/30">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent"
      />
      <div className="p-6 sm:p-8">{children}</div>
    </section>
  );
}
