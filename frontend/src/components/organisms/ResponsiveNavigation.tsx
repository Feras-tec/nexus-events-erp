import { Link } from "@tanstack/react-router";

const navigationItems = [
  { label: "Dashboard", icon: "▦", to: "/dashboard" },
  { label: "Events", icon: "◫", to: "/events" },
  { label: "Customers", icon: "♙", to: "/customers" },
  { label: "Employees", icon: "♟", to: "/employees" },
  { label: "Products", icon: "□" },
  { label: "Inventory", icon: "▤", to: "/equipment" },
  { label: "Reservations", icon: "◷" },
  { label: "Quotes", icon: "▧" },
  { label: "Invoices", icon: "€" },
];

export function ResponsiveNavigation() {
  return (
    <aside className="min-h-screen w-64 border-r border-base-300 bg-base-100">
      <div className="border-b border-base-300 p-6">
        <h1 className="text-xl font-bold">Nexus Events</h1>
        <p className="text-sm text-base-content/60">ERP Management</p>
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
                >
                  <span className="w-5 text-center">{item.icon}</span>
                  {item.label}
                </Link>
              ) : (
                <button type="button">
                  <span className="w-5 text-center">{item.icon}</span>
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
