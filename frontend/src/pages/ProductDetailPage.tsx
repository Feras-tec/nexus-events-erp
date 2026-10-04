import { useState } from "react";
import { useAuth } from "@clerk/react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import { StatusChip } from "../components/atoms/StatusChip";
import { ConfirmDeleteDialog } from "../components/molecules/ConfirmDeleteDialog";
import {
  ProductForm,
  type ProductFormValues,
} from "../components/organisms/ProductForm";
import { DetailLayout } from "../components/templates/DetailLayout";
import { apiFetch } from "../services/api";

type ProductDetail = {
  id: string;
  productNo: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  category?: string | null;
  description?: string | null;
  trackingType: "SERIALIZED" | "QUANTITY";
  usageType: "RENTAL" | "SALE" | "BOTH";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  inventoryItems: {
    id: string;
    assetNo: string;
    manufacturerSerial?: string | null;
    status: string;
    location?: string | null;
    warehouse: {
      id: string;
      name: string;
    };
  }[];
};

type ProductResponse = {
  data: ProductDetail;
};

function trackingLabel(value: ProductDetail["trackingType"]) {
  return value === "SERIALIZED"
    ? "Einzelgerät / Seriennummer"
    : "Mengenartikel";
}

function usageLabel(value: ProductDetail["usageType"]) {
  if (value === "RENTAL") return "Vermietung";
  if (value === "SALE") return "Verkauf";

  return "Vermietung & Verkauf";
}

export function ProductDetailPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
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
  } = useQuery({
    queryKey: ["products", productId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/products/${productId}`,
        token,
      );

      const result = (await response.json()) as ProductResponse;

      return result.data;
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const token = await getToken();

      const payload = {
        name: data.name.trim(),
        brand: data.brand.trim() || undefined,
        model: data.model.trim() || undefined,
        category: data.category.trim() || undefined,
        description: data.description.trim() || undefined,
        trackingType: data.trackingType,
        usageType: data.usageType,
      };

      const response = await apiFetch(
        `/api/products/${productId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["products", productId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["products"],
        }),
      ]);

      setIsEditing(false);
    },
  });

  const deactivateProductMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/products/${productId}/deactivate`,
        token,
        {
          method: "PATCH",
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["products", productId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["products"],
        }),
      ]);

      setShowDeactivateDialog(false);
      setIsEditing(false);
    },
  });

  const activateProductMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/products/${productId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({
            isActive: true,
          }),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["products", productId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["products"],
        }),
      ]);
    },
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
          <section className="rounded-box border border-base-300 bg-base-100 p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold">
                Produktdaten
              </h2>

              <StatusChip
                status={product.isActive ? "ACTIVE" : "INACTIVE"}
              />
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-base-content/60">
                  Produktnummer
                </dt>
                <dd className="font-medium">
                  {product.productNo}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Kategorie
                </dt>
                <dd>{product.category ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Marke
                </dt>
                <dd>{product.brand ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Modell
                </dt>
                <dd>{product.model ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Tracking
                </dt>
                <dd>{trackingLabel(product.trackingType)}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Verwendung
                </dt>
                <dd>{usageLabel(product.usageType)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-box border border-base-300 bg-base-100 p-6">
            <h2 className="mb-3 text-lg font-semibold">
              Beschreibung
            </h2>

            <p className="whitespace-pre-wrap text-base-content/80">
              {product.description || "Keine Beschreibung vorhanden."}
            </p>
          </section>

          <section className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Zugeordnete Geräte
              </h2>
              <p className="text-sm text-base-content/60">
                {product.inventoryItems.length} Gerät(e)
              </p>
            </div>

            {product.inventoryItems.length === 0 ? (
              <p className="text-base-content/60">
                Noch keine Geräte diesem Produkt zugeordnet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Asset-Nr.</th>
                      <th>Seriennummer</th>
                      <th>Lager</th>
                      <th>Standort</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {product.inventoryItems.map((item) => (
                      <tr key={item.id}>
                        <td className="font-medium">
                          {item.assetNo}
                        </td>
                        <td>
                          {item.manufacturerSerial ?? "—"}
                        </td>
                        <td>{item.warehouse.name}</td>
                        <td>{item.location ?? "—"}</td>
                        <td>
                          <StatusChip status={item.status} />
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              navigate({
                                to: "/equipment/$equipmentId",
                                params: {
                                  equipmentId: item.id,
                                },
                              });
                            }}
                          >
                            Anzeigen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
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
