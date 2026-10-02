import type { ReactNode } from "react";
import { ResponsiveNavigation } from "../organisms/ResponsiveNavigation";
import { UserButton } from "@clerk/react";

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-base-200">
      <ResponsiveNavigation />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-base-300 bg-base-100 px-6">
          <div>
            <p className="text-sm text-base-content/60">Management System</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="badge badge-success badge-outline">Online</div>

            <UserButton />
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
