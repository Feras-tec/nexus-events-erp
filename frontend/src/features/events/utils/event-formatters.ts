import i18n from "../../../i18n/config";
import type { EventDetail } from "../types/event.types";

export function formatDateTime(date: string) {
  return new Intl.DateTimeFormat(i18n.language, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function toDateTimeLocal(date: string) {
  const value = new Date(date);

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getCustomerName(
  customer: EventDetail["customer"],
) {
  if (customer.companyName) {
    return customer.companyName;
  }

  const fullName = [
    customer.firstName,
    customer.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return fullName || "—";
}
