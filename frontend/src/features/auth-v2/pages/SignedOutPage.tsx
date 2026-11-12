import { useTranslation } from "react-i18next";
import { CheckCircle2, LogOut } from "lucide-react";

import { AuthCard } from "../components/AuthCard";
import { AuthHeading } from "../components/AuthHeading";
import { AuthShell } from "../components/AuthShell";
import { AuthV2Link, useAuthV2QueryParam } from "../context/navigation";
import { AUTH_V2_PATHS } from "../routing/paths";

const REASONS = new Set([
  "logout",
  "password-reset",
  "invitation-accepted",
  "owner-transferred",
]);

export function SignedOutPage() {
  const { t } = useTranslation();
  const queryReason = useAuthV2QueryParam("reason");
  const reason = queryReason && REASONS.has(queryReason) ? queryReason : "logout";
  const successful = reason === "password-reset" || reason === "invitation-accepted";

  return (
    <AuthShell>
      <AuthCard>
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
            successful
              ? "bg-success/10 text-success"
              : "bg-primary/10 text-primary"
          }`}
        >
          {successful ? <CheckCircle2 size={24} /> : <LogOut size={24} />}
        </div>
        <AuthHeading
          eyebrow={t(`authV2.signedOut.${reason}.eyebrow`)}
          title={t(`authV2.signedOut.${reason}.title`)}
          description={t(`authV2.signedOut.${reason}.text`)}
        />

        <p className="rounded-2xl border border-base-300 bg-base-200/50 p-3 text-xs leading-relaxed text-base-content/60">
          {t("authV2.signedOut.securityNote")}
        </p>

        <AuthV2Link
          to={AUTH_V2_PATHS.signIn}
          className="btn btn-primary mt-5 w-full rounded-xl"
        >
          {t("authV2.signedOut.signInAgain")}
        </AuthV2Link>
      </AuthCard>
    </AuthShell>
  );
}
