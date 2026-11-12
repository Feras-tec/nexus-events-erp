import { useEffect, useId, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "../../../components/atoms/Button";
import { authV2Api } from "../api";
import { AuthV2ApiError } from "../api/client";
import { authV2QueryKeys } from "../api/queryKeys";
import { errorMessageKey, errorSupportCode } from "../lib/errors";
import { FormAlert } from "./FormAlert";
import { Modal } from "./Modal";
import { PasswordField } from "./PasswordField";

type StepUpDialogProps = {
  open: boolean;
  onClose: () => void;
  onVerified?: () => void | Promise<void>;
};

export function StepUpDialog({
  open,
  onClose,
  onVerified,
}: StepUpDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const titleId = useId();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setError(null);
      setBusy(false);
    }
  }, [open]);

  async function submit() {
    if (password.length === 0) {
      setError(new AuthV2ApiError(400, "PASSWORD_REQUIRED"));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await authV2Api.stepUp({ password });
      await queryClient.invalidateQueries({
        queryKey: authV2QueryKeys.me(),
      });
      setPassword("");
      await onVerified?.();
      onClose();
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} closeDisabled={busy}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck size={20} />
        </span>
        <div>
          <h2 id={titleId} className="text-lg font-bold">
            {t("authV2.security.stepUpDialogTitle")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-base-content/65">
            {t("authV2.security.stepUpDialogText")}
          </p>
        </div>
      </div>

      <form
        className="mt-4 space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {error !== null && (
          <FormAlert code={errorSupportCode(error)}>
            {t(errorMessageKey(error))}
          </FormAlert>
        )}

        <PasswordField
          label={t("authV2.security.currentPassword")}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          autoFocus
          disabled={busy}
          required
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" type="button" onClick={onClose} disabled={busy}>
            {t("authV2.common.cancel")}
          </Button>
          <Button type="submit" loading={busy} disabled={password.length === 0}>
            {t("authV2.security.stepUpButton")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
