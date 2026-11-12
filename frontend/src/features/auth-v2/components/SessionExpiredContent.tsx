import { useTranslation } from "react-i18next";
import { ShieldX } from "lucide-react";

import { AuthCard } from "./AuthCard";
import { AuthHeading } from "./AuthHeading";
import { AuthV2Link } from "../context/navigation";
import { AUTH_V2_PATHS } from "../routing/paths";

const REASON_KEYS: Record<string, string> = {
  UNAUTHENTICATED: "unauthenticated",
  ABSOLUTE_EXPIRED: "absoluteExpired",
  IDLE_EXPIRED: "idleExpired",
  ACCOUNT_INACTIVE: "accountInactive",
  MFA_ENROLLMENT_REQUIRED: "mfaEnrollmentRequired",
};

export function SessionExpiredContent({ reason }: { reason?: string | null }) {
  const { t } = useTranslation();
  const reasonKey = reason ? REASON_KEYS[reason] : undefined;

  return (
    <AuthCard>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 text-warning">
        <ShieldX size={24} />
      </div>
      <AuthHeading
        eyebrow={t("authV2.expired.eyebrow")}
        title={t("authV2.expired.title")}
        description={t("authV2.expired.text")}
      />

      <div className="rounded-2xl border border-base-300 bg-base-200/50 p-3.5 text-sm">
        <p className="font-semibold">{t("authV2.expired.reasonLabel")}</p>
        <p className="mt-1 text-base-content/65">
          {t(
            `authV2.expired.reasons.${reasonKey ?? "generic"}`,
            { defaultValue: t("authV2.expired.reasons.generic") },
          )}
        </p>
        {reason && (
          <p className="mt-1.5 text-[11px] text-base-content/45">
            <code dir="ltr">{reason}</code>
          </p>
        )}
      </div>

      <AuthV2Link
        to={AUTH_V2_PATHS.signIn}
        className="btn btn-primary mt-6 w-full rounded-xl"
      >
        {t("authV2.expired.signIn")}
      </AuthV2Link>
    </AuthCard>
  );
}
