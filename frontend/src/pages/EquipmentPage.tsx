import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import {
  EquipmentForm,
} from "../components/organisms/EquipmentForm";
import { EquipmentTable } from "../components/organisms/EquipmentTable";
import { ListLayout } from "../components/templates/ListLayout";
import { useEquipment } from "../features/equipment/hooks/useEquipment";
import { useEquipmentFormOptions } from "../features/equipment/hooks/useEquipmentFormOptions";
import { useCreateEquipment } from "../features/equipment/hooks/useCreateEquipment";

export function EquipmentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    equipment,
    isLoading,
    isError,
  } = useEquipment();

  const {
    products,
    productsLoading,
    productsError,
    warehouses,
    warehousesLoading,
    warehousesError,
  } = useEquipmentFormOptions();

  const { createEquipmentMutation } = useCreateEquipment({
    onSuccess: () => setShowCreateForm(false),
  });

  const normalizedSearch = search.trim().toLowerCase();

  const filteredEquipment = equipment.filter((item) => {
    if (!normalizedSearch) return true;

    const searchableText = [
      item.assetNo,
      item.product.productNo,
      item.product.name,
      item.product.brand,
      item.product.model,
      item.manufacturerSerial,
      item.barcode,
      item.status,
      item.location,
      item.warehouse.name,
      item.warehouse.branch.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  const formDataLoading = productsLoading || warehousesLoading;
  const formDataError = productsError || warehousesError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <ListLayout
        title={t("equipment.title")}
        description={t("equipment.description")}
        searchValue={search}
        searchPlaceholder={t("equipment.search")}
        onSearchChange={setSearch}
        actions={
          <Button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
          >
            {showCreateForm ? t("equipment.cancel") : t("equipment.new")}
          </Button>
        }
      >
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              {formDataLoading && (
                <div className="flex justify-center py-8">
                  <span
                    className="loading loading-spinner loading-lg"
                    aria-label={t("equipment.formLoading")}
                  />
                </div>
              )}

              {formDataError && (
                <div role="alert" className="alert alert-error">
                  {t("equipment.formDataError")}
                </div>
              )}

              {!formDataLoading && !formDataError && (
                <EquipmentForm
                  products={products}
                  warehouses={warehouses}
                  loading={createEquipmentMutation.isPending}
                  onSubmit={(data) =>
                    createEquipmentMutation.mutate(data)
                  }
                />
              )}

              {createEquipmentMutation.isError && (
                <div role="alert" className="alert alert-error mt-4">
                  {t("equipment.createError")}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-center py-12">
            <span
              className="loading loading-spinner loading-lg"
              aria-label={t("equipment.loading")}
            />
          </div>
        )}

        {isError && (
          <div role="alert" className="alert alert-error">
            {t("equipment.loadError")}
          </div>
        )}

        {!isLoading && !isError && (
          <EquipmentTable
            equipment={filteredEquipment}
            onView={(equipmentId) => {
              navigate({
                to: "/equipment/$equipmentId",
                params: {
                  equipmentId,
                },
              });
            }}
          />
        )}
      </ListLayout>
    </motion.div>
  );
}
