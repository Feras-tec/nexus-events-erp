import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../atoms/Button";
import type {
  CustomerFormData,
  CustomerFormErrors,
} from "../../features/customers/types/customer-form.types";
import { validateCustomerForm } from "../../features/customers/utils/customer-form-validation";
import { CustomerFormFields } from "../../features/customers/components/CustomerFormFields";

export type {
  CustomerFormData,
} from "../../features/customers/types/customer-form.types";

type CustomerFormProps = {
  initialValues?: Partial<CustomerFormData>;
  loading?: boolean;
  mode?: "create" | "edit";
  onSubmit: (data: CustomerFormData) => void;
};

const defaultValues: CustomerFormData = {
  customerNo: "",
  type: "COMPANY",
  companyName: "",
  firstName: "",
  lastName: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  vatId: "",
  discount: "0",
};

export function CustomerForm({
  initialValues,
  loading = false,
  mode = "create",
  onSubmit,
}: CustomerFormProps) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<CustomerFormData>({
    ...defaultValues,
    ...initialValues,
  });

  const [errors, setErrors] =
    useState<CustomerFormErrors>({});

  function updateField<K extends keyof CustomerFormData>(
    field: K,
    value: CustomerFormData[K],
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateCustomerForm(formData, t);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit(formData);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-box border border-base-300 bg-base-100 p-6"
    >
      <CustomerFormFields
        values={formData}
        errors={errors}
        mode={mode}
        onUpdate={updateField}
      />

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              {t("common.saving")}
            </>
          ) : (
            t("common.save")
          )}
        </Button>
      </div>
    </form>
  );
}
