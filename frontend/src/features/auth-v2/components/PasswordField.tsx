import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

type PasswordFieldProps = {
  id?: string;
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
};

export function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete = "current-password",
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  autoFocus = false,
  maxLength,
}: PasswordFieldProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const reactId = useId();
  const fieldId = id ?? reactId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="form-control w-full">
      <label htmlFor={fieldId} className="mb-1.5 text-sm font-medium">
        {label}
        {required && (
          <span className="ms-1 text-error" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="relative">
        <input
          id={fieldId}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          maxLength={maxLength}
          dir="ltr"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`input input-bordered h-11 w-full rounded-xl bg-base-100 pe-11 ${
            error ? "input-error" : ""
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="btn btn-ghost btn-circle btn-xs absolute inset-y-0 end-1.5 my-auto text-base-content/55"
          aria-label={t(
            visible ? "authV2.common.hidePassword" : "authV2.common.showPassword",
          )}
          aria-pressed={visible}
          tabIndex={0}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-base-content/55">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
