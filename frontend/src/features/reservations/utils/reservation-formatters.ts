import type { ReservationDetail } from "../types/reservation.types";

export function formatReservationDateTime(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getReservationCustomerName(
  customer: ReservationDetail["event"]["customer"],
) {
  if (customer.companyName) {
    return customer.companyName;
  }

  return (
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—"
  );
}
