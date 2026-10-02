import { Button } from "../atoms/Button";

type ConfirmDeleteDialogProps = {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
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
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="modal modal-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div className="modal-box">
        <h3 id="confirm-delete-title" className="text-lg font-bold">
          {title}
        </h3>

        <p className="py-4 text-base-content/70">{message}</p>

        <div className="modal-action">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant="error"
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
