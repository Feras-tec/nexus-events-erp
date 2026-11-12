import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * Keeps `<html lang>`/`<html dir>` in sync for the isolated auth-v2 entry and
 * for tests. The existing ERP layout keeps its own behaviour untouched.
 */
export function useDocumentDirection(): boolean {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language ?? "de";
  const isRTL = language.startsWith("ar");

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [isRTL, language]);

  return isRTL;
}
