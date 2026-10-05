export function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("de-DE").format(new Date(value));
}

export function formatPrice(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(number);
}
