import { useTranslation } from "react-i18next";
import { Badge } from "./Badge";

type StatusChipProps = {
  status: string;
};

const statusVariants = {
  ACTIVE: "success",
  AVAILABLE: "success",
  PAID: "success",
  CONFIRMED: "success",
  COMPLETED: "success",

  PENDING: "warning",
  PICKING: "warning",
  DRAFT: "warning",

  INACTIVE: "neutral",
  CANCELLED: "neutral",

  ERROR: "error",
  OVERDUE: "error",

  ISSUED: "info",
  RESERVED: "info",
} as const;

export function StatusChip({ status }: StatusChipProps) {
  const { t } = useTranslation();

  const normalizedStatus = status.toUpperCase();

  const variant =
    statusVariants[normalizedStatus as keyof typeof statusVariants] ??
    "neutral";

  return (
    <Badge variant={variant}>
      {t(`status.${normalizedStatus}`, {
        defaultValue: normalizedStatus,
      })}
    </Badge>
  );
}
