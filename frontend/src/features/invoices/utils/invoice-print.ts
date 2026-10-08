import { formatInvoiceDate } from "./invoice-date";

export function formatInvoicePrintCurrency(value: number, locale = "de-DE") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatInvoicePrintDate(
  value?: string | null,
  _locale = "de-DE",
) {
  return formatInvoiceDate(value);
}
