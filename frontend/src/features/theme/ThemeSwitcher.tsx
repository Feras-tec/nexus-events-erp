import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sun, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  getThemePreference,
  saveThemePreference,
  type ThemePreference,
} from "./theme";

export function ThemeSwitcher() {
  const { i18n } = useTranslation();

  const [theme, setTheme] =
    useState<ThemePreference>(getThemePreference);

  const isDark = theme === "dark";

  const language = i18n.language.startsWith("ar")
    ? "ar"
    : i18n.language.startsWith("en")
      ? "en"
      : "de";

  const labels = {
    de: isDark ? "Helles Design aktivieren" : "Dunkles Design aktivieren",
    en: isDark ? "Switch to light mode" : "Switch to dark mode",
    ar: isDark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي",
  };

  function toggleTheme() {
    const nextTheme: ThemePreference =
      isDark ? "light" : "dark";

    setTheme(nextTheme);
    saveThemePreference(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={labels[language]}
      title={labels[language]}
      className="btn btn-ghost btn-square btn-sm rounded-xl border border-base-300 bg-base-100"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Moon size={19} strokeWidth={1.8} />
          ) : (
            <Sun size={19} strokeWidth={1.8} />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
