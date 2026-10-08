import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  LayoutDashboard,
  CalendarDays,
  UsersRound,
  UserRound,
  Package,
  Boxes,
  CalendarCheck2,
  FileText,
  ReceiptText,
  Layers3,
  X,
  type LucideIcon,
} from "lucide-react";

type NavigationItem = {
  key: string;
  to: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { key: "dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { key: "events", icon: CalendarDays, to: "/events" },
  { key: "customers", icon: UsersRound, to: "/customers" },
  { key: "employees", icon: UserRound, to: "/employees" },
  { key: "products", icon: Package, to: "/products" },
  { key: "inventory", icon: Boxes, to: "/equipment" },
  { key: "reservations", icon: CalendarCheck2, to: "/reservations" },
  { key: "quotes", icon: FileText, to: "/quotes" },
  { key: "invoices", icon: ReceiptText, to: "/invoices" },
];

type NavigationContentProps = {
  onNavigate?: () => void;
};

function NavigationContent({ onNavigate }: NavigationContentProps) {
  const { t } = useTranslation();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-24 items-center gap-3 border-b border-base-300 px-5 py-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-content shadow-sm">
          <Layers3 size={23} strokeWidth={1.8} />
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold tracking-tight">
            NEXUS
          </h1>
          <p className="text-xs font-semibold tracking-wider text-base-content/55">
            EVENTS ERP
          </p>
        </div>
      </div>

      <nav
        aria-label={t("app.erpManagement")}
        className="flex-1 overflow-y-auto px-3 py-5"
      >
        <ul className="flex flex-col gap-1.5">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const active =
              pathname === item.to ||
              (item.to !== "/dashboard" &&
                pathname.startsWith(`${item.to}/`));

            return (
              <li key={item.key}>
                <motion.div
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, y: 7 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.22,
                    delay: reduceMotion ? 0 : index * 0.025,
                  }}
                >
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5",
                      "text-sm font-medium transition-colors duration-200",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-base-content/70 hover:bg-base-200 hover:text-base-content",
                    ].join(" ")}
                  >
                    {active && (
                      <motion.span
                        layoutId="nexus-active-navigation"
                        className="absolute inset-y-2 start-0 w-1 rounded-full bg-primary"
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 32,
                        }}
                      />
                    )}

                    <Icon
                      size={19}
                      strokeWidth={active ? 2.2 : 1.8}
                      className="shrink-0"
                      aria-hidden="true"
                    />

                    <span className="min-w-0 flex-1 truncate">
                      {t(`navigation.${item.key}`)}
                    </span>
                  </Link>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-base-300 px-5 py-4">
        <p className="text-xs font-semibold text-base-content/50">
          Nexus Events ERP
        </p>
      </div>
    </div>
  );
}

export function ResponsiveNavigation() {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-e border-base-300 bg-base-100 lg:block">
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
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const isRTL = i18n.dir() === "rtl";

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.button
            type="button"
            aria-label={t("common.closeNavigation")}
            className="absolute inset-0 h-full w-full bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t("app.erpManagement")}
            initial={
              reduceMotion
                ? false
                : { x: isRTL ? "100%" : "-100%" }
            }
            animate={{ x: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { x: isRTL ? "100%" : "-100%" }
            }
            transition={{
              type: "tween",
              duration: reduceMotion ? 0 : 0.26,
              ease: "easeOut",
            }}
            className={[
              "absolute inset-y-0 w-72 max-w-[85vw] overflow-y-auto",
              "border-e border-base-300 bg-base-100 shadow-2xl",
              isRTL ? "right-0" : "left-0",
            ].join(" ")}
          >
            <button
              type="button"
              className="btn btn-ghost btn-square btn-sm absolute end-3 top-3 z-20"
              aria-label={t("common.closeNavigation")}
              onClick={onClose}
            >
              <X size={20} />
            </button>

            <NavigationContent onNavigate={onClose} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
