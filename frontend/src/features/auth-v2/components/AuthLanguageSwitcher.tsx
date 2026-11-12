import { useTranslation } from "react-i18next";
import { Globe2 } from "lucide-react";

type Language = "de" | "en" | "ar";

const LANGUAGES: Array<{ code: Language; short: string; label: string }> = [
  { code: "de", short: "DE", label: "Deutsch" },
  { code: "en", short: "EN", label: "English" },
  { code: "ar", short: "AR", label: "العربية" },
];

export function AuthLanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current =
    LANGUAGES.find((language) =>
      (i18n.resolvedLanguage ?? i18n.language ?? "de").startsWith(language.code),
    ) ?? LANGUAGES[0];

  async function changeLanguage(language: Language) {
    await i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }

  return (
    <label className="relative flex items-center">
      <span className="pointer-events-none absolute start-2.5 text-base-content/60">
        <Globe2 size={15} />
      </span>
      <select
        className="select select-bordered select-sm h-9 min-h-9 rounded-xl bg-base-100 ps-8 pe-7 text-xs font-semibold"
        value={current.code}
        onChange={(event) => {
          void changeLanguage(event.target.value as Language);
        }}
        aria-label={t("authV2.language.label")}
      >
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.short}
          </option>
        ))}
      </select>
    </label>
  );
}
