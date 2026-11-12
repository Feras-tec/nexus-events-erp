import { useId, type ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../components/atoms/Button";
import { Modal } from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  variant?: "error" | "warning" | "primary";
  busy?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  variant = "error",
  busy = false,
  confirmDisabled = false,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      closeDisabled={busy}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
            variant === "error"
              ? "bg-error/10 text-error"
              : variant === "warning"
                ? "bg-warning/10 text-warning"
                : "bg-primary/10 text-primary"
          }`}
        >
          <ShieldAlert size={20} />
        </span>
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <div className="mt-1 text-sm leading-relaxed text-base-content/65">
            {description}
          </div>
        </div>
      </div>

      {children && <div className="mt-4">{children}</div>}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          {t("authV2.common.cancel")}
        </Button>
        <Button
          variant={variant === "primary" ? "primary" : variant}
          loading={busy}
          onClick={onConfirm}
          disabled={confirmDisabled || busy}
        >
          {confirmLabel ?? t("authV2.common.confirm")}
        </Button>
      </div>
    </Modal>
  );
}
