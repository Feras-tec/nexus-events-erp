import { useEffect, useRef, useState, type ReactNode } from "react";
import { UserButton } from "@clerk/react";
import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Menu,
  Globe2,
  ChevronDown,
  Check,
  type LucideIcon,
  LayoutDashboard,
  CalendarDays,
  UsersRound,
  UserRound,
  Package,
  Boxes,
  CalendarCheck2,
  FileText,
  ReceiptText,
} from "lucide-react";

import { ThemeSwitcher } from "../../features/theme/ThemeSwitcher";
import {
  MobileNavigation,
  ResponsiveNavigation,
} from "../organisms/ResponsiveNavigation";

type DashboardLayoutProps = {
  children: ReactNode;
};

type Language = "de" | "en" | "ar";

const languages: Array<{
  code: Language;
  label: string;
}> = [
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
];

const pageItems: Array<{
  key: string;
  path: string;
  icon: LucideIcon;
}> = [
  { key: "dashboard", path: "/dashboard", icon: LayoutDashboard },
  { key: "events", path: "/events", icon: CalendarDays },
  { key: "customers", path: "/customers", icon: UsersRound },
  { key: "employees", path: "/employees", icon: UserRound },
  { key: "products", path: "/products", icon: Package },
  { key: "inventory", path: "/equipment", icon: Boxes },
  { key: "reservations", path: "/reservations", icon: CalendarCheck2 },
  { key: "quotes", path: "/quotes", icon: FileText },
  { key: "invoices", path: "/invoices", icon: ReceiptText },
];

export function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const { i18n, t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    languages.find((language) =>
      i18n.language.startsWith(language.code),
    ) ?? languages[0];

  const currentPage =
    [...pageItems]
      .sort((a, b) => b.path.length - a.path.length)
      .find(
        (item) =>
          pathname === item.path ||
          pathname.startsWith(`${item.path}/`),
      );

  const PageIcon = currentPage?.icon ?? LayoutDashboard;

  async function changeLanguage(language: Language) {
    await i18n.changeLanguage(language);

    document.documentElement.lang = language;
    document.documentElement.dir =
      language === "ar" ? "rtl" : "ltr";

    setLanguageOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        languageRef.current &&
        !languageRef.current.contains(event.target as Node)
      ) {
        setLanguageOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLanguageOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-base-200">
      <ResponsiveNavigation />

      <MobileNavigation
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="dashboard-header sticky top-0 z-30 flex h-17 shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-100/95 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="btn btn-ghost btn-square btn-sm rounded-xl lg:hidden"
              aria-label={t("navigation.open")}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={21} strokeWidth={1.9} />
            </button>

            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
                <PageIcon size={19} strokeWidth={1.9} />
              </div>

              <div className="min-w-0">
                <p className="hidden text-[11px] font-medium text-base-content/50 sm:block">
                  Nexus Events ERP
                </p>
                <h2 className="truncate text-sm font-semibold sm:text-base">
                  {currentPage
                    ? t(`navigation.${currentPage.key}`)
                    : t("app.managementSystem")}
                </h2>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div ref={languageRef} className="relative">
              <button
                type="button"
                className="btn btn-ghost btn-sm gap-1.5 rounded-xl border border-base-300 bg-base-100 px-2.5 sm:px-3"
                aria-label={t("language")}
                aria-haspopup="true"
                aria-expanded={languageOpen}
                onClick={() => setLanguageOpen((open) => !open)}
              >
                <Globe2 size={18} strokeWidth={1.8} />

                <span className="hidden text-xs font-semibold sm:inline">
                  {currentLanguage.code.toUpperCase()}
                </span>

                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    languageOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {languageOpen && (
                  <motion.div
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, y: -6, scale: 0.97 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -6, scale: 0.97 }
                    }
                    transition={{
                      duration: reduceMotion ? 0 : 0.17,
                    }}
                    className="absolute end-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-1.5 shadow-xl"
                  >
                    <p className="px-3 py-2 text-xs font-semibold text-base-content/50">
                      {t("language")}
                    </p>

                    {languages.map((language) => {
                      const active =
                        currentLanguage.code === language.code;

                      return (
                        <button
                          key={language.code}
                          type="button"
                          lang={language.code}
                          className={[
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm",
                            "transition-colors hover:bg-base-200",
                            active
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-base-content",
                          ].join(" ")}
                          onClick={() => changeLanguage(language.code)}
                        >
                          <span className="flex-1">
                            {language.label}
                          </span>

                          {active && <Check size={16} />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ThemeSwitcher />

            <div className="hidden items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1.5 sm:flex">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-xs font-semibold text-success">
                {t("common.online")}
              </span>
            </div>

            <div className="flex items-center ps-1">
              <UserButton />
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
