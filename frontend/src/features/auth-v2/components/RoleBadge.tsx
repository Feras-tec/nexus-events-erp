import { useTranslation } from "react-i18next";
import { Badge } from "../../../components/atoms/Badge";

const VARIANT_BY_ROLE: Record<
  string,
  "primary" | "secondary" | "info" | "neutral"
> = {
  OWNER: "primary",
  ADMIN: "secondary",
  HR_MANAGER: "info",
  ACCOUNTANT: "info",
  SALES_MANAGER: "info",
  PROJECT_MANAGER: "info",
  DEPARTMENT_MANAGER: "info",
  WAREHOUSE_MANAGER: "info",
};

export function RoleBadge({ role }: { role: string }) {
  const { t } = useTranslation();

  return (
    <Badge variant={VARIANT_BY_ROLE[role] ?? "neutral"} outline>
      {t(`authV2.roles.${role}`, { defaultValue: role })}
    </Badge>
  );
}
