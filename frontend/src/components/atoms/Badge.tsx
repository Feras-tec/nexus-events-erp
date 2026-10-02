import type { ReactNode } from "react";

type BadgeVariant =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  outline?: boolean;
  className?: string;
};

export function Badge({
  children,
  variant = "neutral",
  outline = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`badge badge-${variant} ${
        outline ? "badge-outline" : ""
      } ${className}`}
    >
      {children}
    </span>
  );
}
