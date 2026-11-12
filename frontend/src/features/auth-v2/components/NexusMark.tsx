import { useTranslation } from "react-i18next";

type NexusMarkProps = {
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
};

const SIZE_CLASSES = {
  sm: "h-9 w-9 text-base rounded-xl",
  md: "h-11 w-11 text-lg rounded-2xl",
  lg: "h-14 w-14 text-2xl rounded-2xl",
};

export function NexusMark({ size = "md", inverted = false }: NexusMarkProps) {
  const { t } = useTranslation();

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center font-black tracking-tight ${
        SIZE_CLASSES[size]
      } ${
        inverted
          ? "bg-neutral-content text-neutral"
          : "bg-gradient-to-br from-primary to-secondary text-primary-content"
      }`}
      aria-label={t("authV2.brand.markLabel")}
      role="img"
    >
      N
      <span
        aria-hidden="true"
        className={`absolute inset-1 rounded-[inherit] border ${
          inverted ? "border-neutral/15" : "border-primary-content/25"
        }`}
      />
    </span>
  );
}
