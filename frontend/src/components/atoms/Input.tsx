import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({
  label,
  error,
  className = "",
  id,
  ...props
}: InputProps) {
  return (
    <label className="form-control w-full">
      {label && (
        <span className="mb-1 text-sm font-medium">
          {label}
        </span>
      )}

      <input
        id={id}
        className={`input input-bordered w-full ${
          error ? "input-error" : ""
        } ${className}`}
        {...props}
      />

      {error && (
        <span className="mt-1 text-sm text-error">
          {error}
        </span>
      )}
    </label>
  );
}
