import { useEffect, useRef, useState, type ReactNode } from "react";
import { UserButton } from "@clerk/react";
import { useTranslation } from "react-i18next";

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
  flag: string;
  label: string;
}> = [
  {
    code: "de",
    flag: "🇩🇪",
    label: "Deutsch",
  },
  {
    code: "en",
    flag: "🇬🇧",
    label: "English",
  },
  {
    code: "ar",
    flag: "🇸🇦",
    label: "العربية",
  },
];

export function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const { i18n, t } = useTranslation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const languageRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    languages.find((language) =>
      i18n.language.startsWith(language.code),
    ) ?? languages[0];

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
        !languageRef.current.contains(
          event.target as Node,
        )
      ) {
        setLanguageOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
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
        <header className="dashboard-header flex h-16 items-center justify-between border-b border-base-300 bg-base-100 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="btn btn-ghost btn-square lg:hidden"
              aria-label={t("navigation.open")}
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="text-xl">☰</span>
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm text-base-content/60">
                {t("app.managementSystem")}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {/* Language selector */}
            <div
              ref={languageRef}
              className="relative"
            >
              <button
                type="button"
                className="btn btn-ghost btn-sm gap-2 rounded-xl border border-base-300 bg-base-100 px-3"
                aria-haspopup="menu"
                aria-expanded={languageOpen}
                onClick={() =>
                  setLanguageOpen((open) => !open)
                }
              >
                <span className="text-base">🌐</span>

                <span className="hidden font-medium sm:inline">
                  {currentLanguage.code.toUpperCase()}
                </span>

                <span
                  className={`text-xs transition-transform ${
                    languageOpen ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              {languageOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-base-300 bg-base-100 p-1 shadow-xl"
                  role="menu"
                >
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                    {t("language")}
                  </div>

                  {languages.map((language) => {
                    const isActive =
                      currentLanguage.code ===
                      language.code;

                    return (
                      <button
                        key={language.code}
                        type="button"
                        role="menuitem"
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          isActive
                            ? "bg-base-200 font-semibold"
                            : "hover:bg-base-200"
                        }`}
                        onClick={() =>
                          changeLanguage(language.code)
                        }
                      >
                        <span className="text-lg">
                          {language.flag}
                        </span>

                        <span className="flex-1">
                          {language.label}
                        </span>

                        {isActive && (
                          <span className="text-sm">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Online status */}
            <div className="hidden items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 sm:flex">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-sm font-medium text-success">
                {t("common.online")}
              </span>
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
