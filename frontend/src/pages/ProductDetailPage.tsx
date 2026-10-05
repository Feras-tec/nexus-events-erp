import { useState } from "react";
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
          aria-label="Produkt wird geladen"
        />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div role="alert" className="alert alert-error">
        Produkt konnte nicht geladen werden.
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
        description={`Produktnr. ${product.productNo}`}
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
              Zurück
            </Button>

            <Button
              type="button"
              onClick={() =>
                setIsEditing((current) => !current)
              }
            >
              {isEditing ? "Abbrechen" : "Bearbeiten"}
            </Button>

            {product.isActive ? (
              <button
                type="button"
                className="btn btn-error"
                onClick={() => setShowDeactivateDialog(true)}
              >
                Deaktivieren
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success"
                disabled={activateProductMutation.isPending}
                onClick={() => activateProductMutation.mutate()}
              >
                Aktivieren
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
                  Änderungen konnten nicht gespeichert werden.
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
          title="Produkt deaktivieren"
          message={`Möchten Sie das Produkt "${product.name}" wirklich deaktivieren? Vorhandene Geräte bleiben erhalten.`}
          confirmLabel="Produkt deaktivieren"
          loading={deactivateProductMutation.isPending}
          onCancel={() => setShowDeactivateDialog(false)}
          onConfirm={() => deactivateProductMutation.mutate()}
        />
      </DetailLayout>
    </motion.div>
  );
}
