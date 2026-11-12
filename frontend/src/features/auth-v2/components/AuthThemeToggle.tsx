import { useTranslation } from "react-i18next";
import { Moon, Sun } from "lucide-react";

import {
  applyTheme,
  getThemePreference,
  saveThemePreference,
  type ThemePreference,
} from "../../theme/theme";
import { useState } from "react";

export function AuthThemeToggle() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference);
  const nextTheme: ThemePreference = theme === "dark" ? "light" : "dark";

  function toggle() {
    saveThemePreference(nextTheme);
    applyTheme(nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      className="btn btn-ghost btn-circle btn-sm border border-base-300 bg-base-100"
      onClick={toggle}
      aria-label={t(
        nextTheme === "dark" ? "authV2.theme.toDark" : "authV2.theme.toLight",
      )}
      title={t(
        nextTheme === "dark" ? "authV2.theme.toDark" : "authV2.theme.toLight",
      )}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
