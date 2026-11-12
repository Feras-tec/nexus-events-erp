import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  closeDisabled?: boolean;
};

export function Modal({
  open,
  onClose,
  labelledBy,
  children,
  closeDisabled = false,
}: ModalProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open) {
      if (dialog.open) return;
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    } else if (dialog.open || dialog.hasAttribute("open")) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    function handleCancel(event: Event) {
      event.preventDefault();
      if (!closeDisabled) onClose();
    }

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [closeDisabled, onClose]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={labelledBy}
      aria-modal="true"
      onClick={(event) => {
        if (event.target === ref.current && !closeDisabled) onClose();
      }}
    >
      <div className="modal-box max-w-lg rounded-3xl border border-base-300 p-0">
        <div className="flex items-center justify-between gap-3 border-b border-base-300 px-5 py-3.5">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-base-content/45">
            {t("authV2.common.secureDialog")}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-xs"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label={t("authV2.common.close")}
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose} disabled={closeDisabled}>
          {t("authV2.common.close")}
        </button>
      </form>
    </dialog>
  );
}
