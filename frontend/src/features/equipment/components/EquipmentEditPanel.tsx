import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";

import {
  EquipmentForm,
  type EquipmentFormValues,
} from "../../../components/organisms/EquipmentForm";

type ProductOption = Parameters<
  typeof EquipmentForm
>[0]["products"][number];

type WarehouseOption = Parameters<
  typeof EquipmentForm
>[0]["warehouses"][number];

type EquipmentEditPanelProps = {
  initialValues: EquipmentFormValues;
  products: ProductOption[];
  warehouses: WarehouseOption[];
  loading: boolean;
  dataLoading: boolean;
  dataError: boolean;
  updateError: boolean;
  isEditing: boolean;
  onSubmit: (data: EquipmentFormValues) => void;
};

export function EquipmentEditPanel({
  initialValues,
  products,
  warehouses,
  loading,
  dataLoading,
  dataError,
  updateError,
  isEditing,
  onSubmit,
}: EquipmentEditPanelProps) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="mb-6 rounded-box border border-base-300 bg-base-100 p-6"
        >
          {dataLoading && (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg" />
            </div>
          )}

          {dataError && (
            <div role="alert" className="alert alert-error">
              {t("equipment.editPanel.dataError")}
            </div>
          )}

          {!dataLoading && !dataError && (
            <EquipmentForm
              mode="edit"
              products={products}
              warehouses={warehouses}
              initialValues={initialValues}
              loading={loading}
              onSubmit={onSubmit}
            />
          )}

          {updateError && (
            <div role="alert" className="alert alert-error mt-4">
              {t("equipment.editPanel.updateError")}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
