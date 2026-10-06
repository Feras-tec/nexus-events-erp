import type {
  CustomerFormData,
  CustomerFormErrors,
} from "../types/customer-form.types";

export function validateCustomerForm(
  formData: CustomerFormData,
): CustomerFormErrors {
  const errors: CustomerFormErrors = {};

  if (!formData.customerNo.trim()) {
    errors.customerNo = "Kundennummer ist erforderlich.";
  }

  if (
    formData.type === "COMPANY" &&
    !formData.companyName.trim()
  ) {
    errors.companyName =
      "Firmenname ist für Firmenkunden erforderlich.";
  }

  if (
    formData.type === "PRIVATE" &&
    !formData.firstName.trim()
  ) {
    errors.firstName =
      "Vorname ist für Privatkunden erforderlich.";
  }

  if (
    formData.type === "PRIVATE" &&
    !formData.lastName.trim()
  ) {
    errors.lastName =
      "Nachname ist für Privatkunden erforderlich.";
  }

  const discount = Number(formData.discount);

  if (
    formData.discount.trim() === "" ||
    Number.isNaN(discount) ||
    discount < 0 ||
    discount > 100
  ) {
    errors.discount =
      "Rabatt muss zwischen 0 und 100 liegen.";
  }

  return errors;
}
