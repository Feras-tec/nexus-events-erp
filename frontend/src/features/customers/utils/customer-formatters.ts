import type { CustomerDetail } from "../types/customer.types";

export function getCustomerName(customer: CustomerDetail) {
  if (customer.companyName) {
    return customer.companyName;
  }

  const fullName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ");

  return fullName || "—";
}
