import { useTranslation } from "react-i18next";

import type { EmployeeFormValues } from "../types/employee-form.types";

type EmployeePersonalFieldsProps = {
  values: EmployeeFormValues;
  loading: boolean;
  onUpdate: <K extends keyof EmployeeFormValues>(
    field: K,
    value: EmployeeFormValues[K],
  ) => void;
};

export function EmployeePersonalFields({
  values,
  loading,
  onUpdate,
}: EmployeePersonalFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          {t("employees.form.firstName")}
        </legend>

        <input
          type="text"
          className="input w-full"
          value={values.firstName}
          onChange={(event) =>
            onUpdate("firstName", event.target.value)
          }
          disabled={loading}
          required
          minLength={2}
          maxLength={100}
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          {t("employees.form.lastName")}
        </legend>

        <input
          type="text"
          className="input w-full"
          value={values.lastName}
          onChange={(event) =>
            onUpdate("lastName", event.target.value)
          }
          disabled={loading}
          required
          minLength={2}
          maxLength={100}
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          {t("employees.form.email")}
        </legend>

        <input
          type="email"
          className="input w-full"
          value={values.email}
          onChange={(event) =>
            onUpdate("email", event.target.value)
          }
          disabled={loading}
          maxLength={254}
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          {t("employees.form.phone")}
        </legend>

        <input
          type="tel"
          className="input w-full"
          value={values.phone}
          onChange={(event) =>
            onUpdate("phone", event.target.value)
          }
          disabled={loading}
          maxLength={50}
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          {t("employees.form.birthDate")}
        </legend>

        <input
          type="date"
          className="input w-full"
          value={values.birthDate}
          onChange={(event) =>
            onUpdate("birthDate", event.target.value)
          }
          disabled={loading}
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          {t("employees.form.nationality")}
        </legend>

        <input
          type="text"
          className="input w-full"
          value={values.nationality}
          onChange={(event) =>
            onUpdate("nationality", event.target.value)
          }
          disabled={loading}
          maxLength={100}
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">
          {t("employees.form.position")}
        </legend>

        <input
          type="text"
          className="input w-full"
          value={values.position}
          onChange={(event) =>
            onUpdate("position", event.target.value)
          }
          disabled={loading}
          maxLength={100}
        />
      </fieldset>
    </>
  );
}
