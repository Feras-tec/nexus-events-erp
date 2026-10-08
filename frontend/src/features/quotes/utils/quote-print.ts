function getQuotePrintLocale(language: string) {
  if (language.startsWith("ar")) return "ar";
  if (language.startsWith("en")) return "en-GB";
  return "de-DE";
}

export function formatQuotePrintCurrency(
  value: number,
  language = "de",
) {
  return new Intl.NumberFormat(getQuotePrintLocale(language), {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatQuotePrintDate(
  value?: string | null,
  language = "de",
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    getQuotePrintLocale(language),
  ).format(new Date(value));
}
