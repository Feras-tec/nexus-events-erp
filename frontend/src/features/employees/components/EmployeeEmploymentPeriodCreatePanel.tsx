import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";

import {
  EmploymentPeriodForm,
  type EmploymentPeriodFormData,
} from "../../../components/organisms/EmploymentPeriodForm";

type EmployeeEmploymentPeriodCreatePanelProps = {
  open: boolean;
  loading: boolean;
  error: boolean;
  onSubmit: (data: EmploymentPeriodFormData) => void;
};

export function EmployeeEmploymentPeriodCreatePanel({
  open,
  loading,
  error,
  onSubmit,
}: EmployeeEmploymentPeriodCreatePanelProps) {
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
          <EmploymentPeriodForm
            loading={loading}
            onSubmit={onSubmit}
          />

          {error && (
            <div
              role="alert"
              className="alert alert-error mt-4"
            >
              {t(
                "employees.detail.employmentPeriod.createError",
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
