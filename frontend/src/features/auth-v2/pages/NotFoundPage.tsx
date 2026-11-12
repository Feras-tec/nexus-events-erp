import { useTranslation } from "react-i18next";
import { ShieldAlert } from "lucide-react";

import { AuthCard } from "../components/AuthCard";
import { AuthHeading } from "../components/AuthHeading";
import { AuthShell } from "../components/AuthShell";
import { AuthV2Link } from "../context/navigation";
import { AUTH_V2_PATHS } from "../routing/paths";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <AuthShell>
      <AuthCard>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 text-warning">
          <ShieldAlert size={24} />
        </div>
        <AuthHeading
          eyebrow={t("authV2.notFound.eyebrow")}
          title={t("authV2.notFound.title")}
          description={t("authV2.notFound.text")}
        />
        <AuthV2Link
          to={AUTH_V2_PATHS.signIn}
          className="btn btn-primary w-full rounded-xl"
        >
          {t("authV2.common.backToSignIn")}
        </AuthV2Link>
      </AuthCard>
    </AuthShell>
  );
}
