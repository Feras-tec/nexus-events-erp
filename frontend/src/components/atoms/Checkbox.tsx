import type { InputHTMLAttributes } from "react";

type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: string;
};

export function Checkbox({
  label,
  className = "",
  id,
  ...props
}: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3"
    >
      <input
        id={id}
        type="checkbox"
        className={`checkbox checkbox-primary ${className}`}
        {...props}
      />

      <span className="text-sm">{label}</span>
    </label>
  );
}
