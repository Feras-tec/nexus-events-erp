import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";

export function RecoveryCodeList({ codes }: { codes: string[] }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copyAll() {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="rounded-2xl border border-base-300 bg-base-200/50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/60">
          <KeyRound size={14} />
          {t("authV2.mfa.backupTitle")}
        </p>
        <button
          type="button"
          onClick={() => void copyAll()}
          className="btn btn-ghost btn-xs gap-1 rounded-lg"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? t("authV2.common.copied") : t("authV2.common.copy")}
        </button>
      </div>

      <ul
        data-testid="auth-v2-recovery-codes"
        dir="ltr"
        className="grid grid-cols-1 gap-1.5 font-mono text-[13px] sm:grid-cols-2"
      >
        {codes.map((code) => (
          <li
            key={code}
            className="select-all rounded-lg border border-base-300 bg-base-100 px-2.5 py-1.5 text-center tracking-wide"
          >
            {code}
          </li>
        ))}
      </ul>

      <p className="mt-2 text-[11px] text-base-content/55" aria-live="polite">
        {failed ? t("authV2.common.copyFailed") : t("authV2.mfa.backupHint")}
      </p>
    </div>
  );
}
