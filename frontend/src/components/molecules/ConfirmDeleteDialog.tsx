import { useId, type ReactNode } from "react";
import { Button } from "../atoms/Button";

type ConfirmDeleteDialogProps = {
  open: boolean;
  title?: ReactNode;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "error" | "warning" | "success" | "primary";
  error?: string | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDeleteDialog({
  open,
  title = "Löschen bestätigen",
  message = "Möchten Sie diesen Eintrag wirklich löschen?",
  confirmLabel = "Löschen",
  cancelLabel = "Abbrechen",
  confirmVariant = "error",
  error = null,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  const titleId = useId();
  const messageId = useId();

  if (!open) return null;

  return (
    <div
      className="modal modal-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
    >
      <div className="modal-box w-11/12 max-w-md">
        <h3 id={titleId} className="text-lg font-bold">
          {title}
        </h3>

        <p id={messageId} className="py-4 text-base-content/70">
          {message}
        </p>

        {error && (
          <div role="alert" className="alert alert-error mb-4 break-words">
            {error}
          </div>
        )}

        <div className="modal-action flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={confirmVariant}
            className="w-full sm:w-auto"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>

      <button
        type="button"
        className="modal-backdrop"
        aria-label="Dialog schließen"
        onClick={onCancel}
        disabled={loading}
      />
    </div>
  );
}
