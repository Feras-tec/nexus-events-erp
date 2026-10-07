import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

const navigationItems = [
  { key: "dashboard", icon: "▦", to: "/dashboard" },
  { key: "events", icon: "◫", to: "/events" },
  { key: "customers", icon: "♙", to: "/customers" },
  { key: "employees", icon: "♟", to: "/employees" },
  { key: "products", icon: "□", to: "/products" },
  { key: "inventory", icon: "▤", to: "/equipment" },
  { key: "reservations", icon: "◷", to: "/reservations" },
  { key: "quotes", icon: "▧", to: "/quotes" },
  { key: "invoices", icon: "€", to: "/invoices" },
] as const;

type NavigationContentProps = {
  onNavigate?: () => void;
};

function NavigationContent({ onNavigate }: NavigationContentProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="border-b border-base-300 p-6">
        <h1 className="text-xl font-bold">Nexus Events</h1>
        <p className="text-sm text-base-content/60">
          {t("app.erpManagement")}
        </p>
      </div>

      <nav className="p-4">
        <ul className="menu gap-1">
          {navigationItems.map((item) => (
            <li key={item.key}>
              <Link
                to={item.to}
                activeProps={{
                  className: "menu-active",
                }}
                onClick={onNavigate}
              >
                <span className="w-5 text-center">{item.icon}</span>
                {t(`navigation.${item.key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export function ResponsiveNavigation() {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-base-300 bg-base-100 lg:block">
      <NavigationContent />
    </aside>
  );
}

type MobileNavigationProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileNavigation({
  open,
  onClose,
}: MobileNavigationProps) {
  const { t } = useTranslation();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={t("common.closeNavigation")}
        onClick={onClose}
      />

      <aside className="relative z-10 min-h-screen w-72 max-w-[85vw] overflow-y-auto border-r border-base-300 bg-base-100 shadow-xl">
        <div className="absolute right-3 top-3 z-20">
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square"
            aria-label={t("common.closeNavigation")}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <NavigationContent onNavigate={onClose} />
      </aside>
    </div>
  );
}
