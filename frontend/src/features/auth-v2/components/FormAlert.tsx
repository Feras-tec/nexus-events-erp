import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

type AlertVariant = "error" | "success" | "warning" | "info";

type FormAlertProps = {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  code?: string | null;
};

const STYLES: Record<AlertVariant, { box: string; icon: ReactNode }> = {
  error: {
    box: "border-error/30 bg-error/10 text-error",
    icon: <CircleAlert size={18} className="mt-0.5 shrink-0" />,
  },
  success: {
    box: "border-success/30 bg-success/10 text-success",
    icon: <CircleCheck size={18} className="mt-0.5 shrink-0" />,
  },
  warning: {
    box: "border-warning/35 bg-warning/10 text-warning",
    icon: <TriangleAlert size={18} className="mt-0.5 shrink-0" />,
  },
  info: {
    box: "border-info/30 bg-info/10 text-info",
    icon: <Info size={18} className="mt-0.5 shrink-0" />,
  },
};

export function FormAlert({
  variant = "error",
  title,
  children,
  code,
}: FormAlertProps) {
  const { t } = useTranslation();
  const style = STYLES[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={`flex items-start gap-2.5 rounded-2xl border p-3.5 text-sm ${style.box}`}
    >
      {style.icon}
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? "mt-0.5 leading-relaxed" : "leading-relaxed"}>
          {children}
        </div>
        {code && (
          <p className="mt-1.5 text-[11px] opacity-70">
            {t("authV2.common.errorCode")}: <code dir="ltr">{code}</code>
          </p>
        )}
      </div>
    </div>
  );
}
