import { useTranslation } from "react-i18next";

type Language = "de" | "en" | "ar";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  async function changeLanguage(language: Language) {
    await i18n.changeLanguage(language);

    document.documentElement.lang = language;
    document.documentElement.dir =
      language === "ar" ? "rtl" : "ltr";
  }

  return (
    <select
      className="select select-bordered select-sm"
      value={i18n.language}
      onChange={(event) =>
        changeLanguage(event.target.value as Language)
      }
      aria-label="Sprache auswählen"
    >
      <option value="de">DE</option>
      <option value="en">EN</option>
      <option value="ar">AR</option>
    </select>
  );
}
