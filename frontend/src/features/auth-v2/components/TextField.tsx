import { useId, type InputHTMLAttributes, type ReactNode } from "react";

type TextFieldProps = {
  id?: string;
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  dir?: "ltr" | "rtl" | "auto";
  leadingIcon?: ReactNode;
  spellCheck?: boolean;
};

export function TextField({
  id,
  name,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  readOnly = false,
  autoFocus = false,
  maxLength,
  inputMode,
  dir,
  leadingIcon,
  spellCheck,
}: TextFieldProps) {
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
        {leadingIcon && (
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-base-content/45">
            {leadingIcon}
          </span>
        )}
        <input
          id={fieldId}
          name={name}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          autoFocus={autoFocus}
          maxLength={maxLength}
          inputMode={inputMode}
          dir={dir}
          spellCheck={spellCheck}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`input input-bordered h-11 w-full rounded-xl bg-base-100 ${
            leadingIcon ? "ps-10" : ""
          } ${error ? "input-error" : ""}`}
        />
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
