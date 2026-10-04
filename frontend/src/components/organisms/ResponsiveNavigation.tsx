import { Link } from "@tanstack/react-router";

const navigationItems = [
  { label: "Dashboard", icon: "▦", to: "/dashboard" },
  { label: "Events", icon: "◫", to: "/events" },
  { label: "Customers", icon: "♙", to: "/customers" },
  { label: "Employees", icon: "♟", to: "/employees" },
  { label: "Products", icon: "□", to: "/products" },
  { label: "Inventory", icon: "▤", to: "/equipment" },
  { label: "Reservations", icon: "◷" },
  { label: "Quotes", icon: "▧" },
  { label: "Invoices", icon: "€" },
];

type NavigationContentProps = {
  onNavigate?: () => void;
};

function NavigationContent({
  onNavigate,
}: NavigationContentProps) {
  return (
    <>
      <div className="border-b border-base-300 p-6">
        <h1 className="text-xl font-bold">Nexus Events</h1>
        <p className="text-sm text-base-content/60">
          ERP Management
        </p>
      </div>

      <nav className="p-4">
        <ul className="menu gap-1">
          {navigationItems.map((item) => (
            <li key={item.label}>
              {item.to ? (
                <Link
                  to={item.to}
                  activeProps={{
                    className: "menu-active",
                  }}
                  onClick={onNavigate}
                >
                  <span className="w-5 text-center">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ) : (
                <button type="button">
                  <span className="w-5 text-center">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              )}
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
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Navigation schließen"
        onClick={onClose}
      />

      <aside className="relative z-10 min-h-screen w-72 max-w-[85vw] overflow-y-auto border-r border-base-300 bg-base-100 shadow-xl">
        <div className="absolute right-3 top-3 z-20">
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Navigation schließen"
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
