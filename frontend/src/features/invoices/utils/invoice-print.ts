export function formatInvoicePrintCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatInvoicePrintDate(
  value?: string | null,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("de-DE").format(
    new Date(value),
  );
}
