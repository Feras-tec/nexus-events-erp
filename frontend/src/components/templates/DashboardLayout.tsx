import { useState, type ReactNode } from "react";
import { UserButton } from "@clerk/react";

import {
  MobileNavigation,
  ResponsiveNavigation,
} from "../organisms/ResponsiveNavigation";

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-base-200">
      <ResponsiveNavigation />

      <MobileNavigation
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-base-300 bg-base-100 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="btn btn-ghost btn-square lg:hidden"
              aria-label="Navigation öffnen"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="text-xl">☰</span>
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm text-base-content/60">
                Management System
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="badge badge-success badge-outline">
              Online
            </div>

            <UserButton />
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
