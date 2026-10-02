import type { ReactNode } from "react";

type IconProps = {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function Icon({
  children,
  size = "md",
  className = "",
  label,
}: IconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      {children}
    </span>
  );
}
