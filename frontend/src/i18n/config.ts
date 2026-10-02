import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  de: {
    translation: {
      language: "Sprache",
    },
  },
  en: {
    translation: {
      language: "Language",
    },
  },
  ar: {
    translation: {
      language: "اللغة",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "de",
  fallbackLng: "de",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
