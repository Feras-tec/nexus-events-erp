import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { EmployeeDocumentForm } from "../../../components/organisms/EmployeeDocumentForm";
import type { EmployeeDocumentFormData } from "../../../components/organisms/EmployeeDocumentForm";

type EmployeeDocumentCreatePanelProps = {
  open: boolean;
  loading: boolean;
  error: boolean;
  onSubmit: (data: EmployeeDocumentFormData) => void;
};

export function EmployeeDocumentCreatePanel({
  open,
  loading,
  error,
  onSubmit,
}: EmployeeDocumentCreatePanelProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mt-5"
        >
          <EmployeeDocumentForm
            loading={loading}
            onSubmit={onSubmit}
          />

          {error && (
            <div
              role="alert"
              className="alert alert-error mt-4"
            >
              {t(
                "employees.detail.documents.createError",
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
