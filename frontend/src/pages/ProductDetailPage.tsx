import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import { ConfirmDeleteDialog } from "../components/molecules/ConfirmDeleteDialog";
import {
  ProductForm,
  type ProductFormValues,
} from "../components/organisms/ProductForm";
import { DetailLayout } from "../components/templates/DetailLayout";
import { ProductOverview } from "../features/products/components/ProductOverview";
import { ProductEquipmentList } from "../features/products/components/ProductEquipmentList";
import { useProductDetail } from "../features/products/hooks/useProductDetail";
import { useUpdateProduct } from "../features/products/hooks/useUpdateProduct";
import { useDeactivateProduct } from "../features/products/hooks/useDeactivateProduct";
import { useActivateProduct } from "../features/products/hooks/useActivateProduct";

export function ProductDetailPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] =
    useState(false);

  const { productId } = useParams({
    from: "/app/products/$productId",
  });

  const {
    data: product,
    isLoading,
    isError,
  } = useProductDetail(productId);

  const { updateProductMutation } = useUpdateProduct({
    productId,
    onSuccess: () => {
      setIsEditing(false);
    },
  });

  const { deactivateProductMutation } = useDeactivateProduct({
    productId,
    onSuccess: () => {
      setShowDeactivateDialog(false);
      setIsEditing(false);
    },
  });

  const { activateProductMutation } = useActivateProduct({
    productId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span
          className="loading loading-spinner loading-lg"
          aria-label={t("products.detail.loading")}
        />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div role="alert" className="alert alert-error">
        {t("products.detail.loadError")}
      </div>
    );
  }

  const initialValues: ProductFormValues = {
    productNo: product.productNo,
    name: product.name,
    brand: product.brand ?? "",
    model: product.model ?? "",
    category: product.category ?? "",
    description: product.description ?? "",
    trackingType: product.trackingType,
    usageType: product.usageType,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <DetailLayout
        title={product.name}
        description={`${t("products.table.productNo")} ${product.productNo}`}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                navigate({
                  to: "/products",
                });
              }}
            >
              {t("products.detail.back")}
            </Button>

            <Button
              type="button"
              onClick={() =>
                setIsEditing((current) => !current)
              }
            >
              {isEditing ? t("products.cancel") : t("products.detail.edit")}
            </Button>

            {product.isActive ? (
              <button
                type="button"
                className="btn btn-error"
                onClick={() => setShowDeactivateDialog(true)}
              >
                {t("products.detail.deactivate")}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success"
                disabled={activateProductMutation.isPending}
                onClick={() => activateProductMutation.mutate()}
              >
                {t("products.detail.activate")}
              </button>
            )}
          </>
        }
      >
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="mb-6 rounded-box border border-base-300 bg-base-100 p-6"
            >
              <ProductForm
                mode="edit"
                initialValues={initialValues}
                loading={updateProductMutation.isPending}
                onSubmit={(data) =>
                  updateProductMutation.mutate(data)
                }
              />

              {updateProductMutation.isError && (
                <div
                  role="alert"
                  className="alert alert-error mt-4"
                >
                  {t("products.detail.updateError")}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 lg:grid-cols-2">
          <ProductOverview product={product} />

          <ProductEquipmentList
            inventoryItems={product.inventoryItems}
          />
        </div>

        <ConfirmDeleteDialog
          open={showDeactivateDialog}
          title={t("products.detail.deactivateTitle")}
          message={t("products.detail.deactivateMessage", { name: product.name })}
          confirmLabel={t("products.detail.deactivateTitle")}
          loading={deactivateProductMutation.isPending}
          onCancel={() => setShowDeactivateDialog(false)}
          onConfirm={() => deactivateProductMutation.mutate()}
        />
      </DetailLayout>
    </motion.div>
  );
}
