import { useTranslation } from "react-i18next";

export function AuthLoading({ label }: { label?: string }) {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[16rem] flex-col items-center justify-center gap-3"
    >
      <span className="loading loading-spinner loading-lg text-primary" />
      <span className="text-sm text-base-content/60">
        {label ?? t("authV2.common.loading")}
      </span>
    </div>
  );
}
