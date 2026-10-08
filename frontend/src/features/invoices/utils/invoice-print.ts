export function formatInvoicePrintCurrency(value: number, locale = "de-DE") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatInvoicePrintDate(
  value?: string | null,
  locale = "de-DE",
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale).format(
    new Date(value),
  );
}
