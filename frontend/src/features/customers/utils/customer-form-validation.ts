import type { TFunction } from "i18next";

import type {
  CustomerFormData,
  CustomerFormErrors,
} from "../types/customer-form.types";

export function validateCustomerForm(
  formData: CustomerFormData,
  t: TFunction,
): CustomerFormErrors {
  const errors: CustomerFormErrors = {};

  if (!formData.customerNo.trim()) {
    errors.customerNo = t("customers.validation.customerNoRequired");
  }

  if (
    formData.type === "COMPANY" &&
    !formData.companyName.trim()
  ) {
    errors.companyName = t(
      "customers.validation.companyNameRequired",
    );
  }

  if (
    formData.type === "PRIVATE" &&
    !formData.firstName.trim()
  ) {
    errors.firstName = t(
      "customers.validation.firstNameRequired",
    );
  }

  if (
    formData.type === "PRIVATE" &&
    !formData.lastName.trim()
  ) {
    errors.lastName = t(
      "customers.validation.lastNameRequired",
    );
  }

  const discount = Number(formData.discount);

  if (
    formData.discount.trim() === "" ||
    Number.isNaN(discount) ||
    discount < 0 ||
    discount > 100
  ) {
    errors.discount = t(
      "customers.validation.discountRange",
    );
  }

  return errors;
}
