import { useTranslation } from "react-i18next";

import { AuthShell } from "../components/AuthShell";
import { SessionExpiredContent } from "../components/SessionExpiredContent";
import { useAuthV2QueryParam } from "../context/navigation";

export function SessionExpiredPage({ reason: reasonProp }: { reason?: string }) {
  const queryReason = useAuthV2QueryParam("reason");
  const { t } = useTranslation();

  return (
    <AuthShell>
      <p className="sr-only">{t("authV2.expired.eyebrow")}</p>
      <SessionExpiredContent reason={reasonProp ?? queryReason} />
    </AuthShell>
  );
}
