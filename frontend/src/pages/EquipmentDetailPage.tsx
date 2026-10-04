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
import {
  EquipmentForm,
  type EquipmentFormValues,
  type ProductOption,
  type WarehouseOption,
} from "../components/organisms/EquipmentForm";
import { DetailLayout } from "../components/templates/DetailLayout";
import { apiFetch } from "../services/api";

type EquipmentDetail = {
  id: string;
  assetNo: string;
  manufacturerSerial?: string | null;
  barcode?: string | null;
  status: EquipmentFormValues["status"];
  location?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: string | number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  productId: string;
  warehouseId: string;

  product: ProductOption & {
    category?: string | null;
    description?: string | null;
    trackingType: "SERIALIZED" | "QUANTITY";
    usageType: "RENTAL" | "SALE" | "BOTH";
  };

  warehouse: WarehouseOption & {
    code?: string;
    address?: string | null;
  };
};

type EquipmentResponse = {
  data: EquipmentDetail;
};

type ProductsResponse = {
  data: ProductOption[];
};

type WarehousesResponse = {
  data: WarehouseOption[];
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("de-DE").format(
    new Date(value),
  );
}

function formatPrice(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(number);
}

export function EquipmentDetailPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);

  const { equipmentId } = useParams({
    from: "/app/equipment/$equipmentId",
  });

  const {
    data: equipment,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["equipment", equipmentId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/inventory-items/${equipmentId}`,
        token,
      );

      const result = (await response.json()) as EquipmentResponse;

      return result.data;
    },
  });

  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/products", token);
      const result = (await response.json()) as ProductsResponse;

      return result.data;
    },
  });

  const {
    data: warehouses = [],
    isLoading: warehousesLoading,
    isError: warehousesError,
  } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/warehouses", token);
      const result = (await response.json()) as WarehousesResponse;

      return result.data;
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: async (data: EquipmentFormValues) => {
      const token = await getToken();

      const payload = {
        manufacturerSerial:
          data.manufacturerSerial.trim() || undefined,
        barcode: data.barcode.trim() || undefined,
        status: data.status,
        location: data.location.trim() || undefined,
        purchaseDate: data.purchaseDate || undefined,
        purchasePrice: data.purchasePrice
          ? Number(data.purchasePrice)
          : undefined,
        notes: data.notes.trim() || undefined,
        warehouseId: data.warehouseId,
      };

      const response = await apiFetch(
        `/api/inventory-items/${equipmentId}`,
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
          queryKey: ["equipment", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
      ]);

      setIsEditing(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span
          className="loading loading-spinner loading-lg"
          aria-label="Gerät wird geladen"
        />
      </div>
    );
  }

  if (isError || !equipment) {
    return (
      <div role="alert" className="alert alert-error">
        Gerät konnte nicht geladen werden.
      </div>
    );
  }

  const initialValues: EquipmentFormValues = {
    assetNo: equipment.assetNo,
    manufacturerSerial: equipment.manufacturerSerial ?? "",
    barcode: equipment.barcode ?? "",
    status: equipment.status,
    location: equipment.location ?? "",
    purchaseDate: equipment.purchaseDate
      ? equipment.purchaseDate.slice(0, 10)
      : "",
    purchasePrice:
      equipment.purchasePrice !== null &&
      equipment.purchasePrice !== undefined
        ? String(equipment.purchasePrice)
        : "",
    notes: equipment.notes ?? "",
    productId: equipment.productId,
    warehouseId: equipment.warehouseId,
  };

  const formDataLoading = productsLoading || warehousesLoading;
  const formDataError = productsError || warehousesError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <DetailLayout
        title={equipment.product.name}
        description={`Asset-Nr. ${equipment.assetNo}`}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                navigate({
                  to: "/equipment",
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
              {formDataLoading && (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg" />
                </div>
              )}

              {formDataError && (
                <div role="alert" className="alert alert-error">
                  Produkte oder Lager konnten nicht geladen werden.
                </div>
              )}

              {!formDataLoading && !formDataError && (
                <EquipmentForm
                  mode="edit"
                  products={products}
                  warehouses={warehouses}
                  initialValues={initialValues}
                  loading={updateEquipmentMutation.isPending}
                  onSubmit={(data) =>
                    updateEquipmentMutation.mutate(data)
                  }
                />
              )}

              {updateEquipmentMutation.isError && (
                <div role="alert" className="alert alert-error mt-4">
                  Änderungen konnten nicht gespeichert werden.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-box border border-base-300 bg-base-100 p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Gerätedaten
                </h2>
                <p className="text-sm text-base-content/60">
                  Technische und interne Informationen
                </p>
              </div>

              <StatusChip status={equipment.status} />
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-base-content/60">
                  Asset-Nr.
                </dt>
                <dd className="font-medium">{equipment.assetNo}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Seriennummer
                </dt>
                <dd>{equipment.manufacturerSerial ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Barcode
                </dt>
                <dd>{equipment.barcode ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Standort
                </dt>
                <dd>{equipment.location ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Kaufdatum
                </dt>
                <dd>{formatDate(equipment.purchaseDate)}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Kaufpreis
                </dt>
                <dd>{formatPrice(equipment.purchasePrice)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-box border border-base-300 bg-base-100 p-6">
            <h2 className="mb-5 text-lg font-semibold">
              Produkt & Lager
            </h2>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-base-content/60">
                  Produktnummer
                </dt>
                <dd className="font-medium">
                  {equipment.product.productNo}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Produkt
                </dt>
                <dd>{equipment.product.name}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Marke
                </dt>
                <dd>{equipment.product.brand ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Modell
                </dt>
                <dd>{equipment.product.model ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Kategorie
                </dt>
                <dd>{equipment.product.category ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Lager
                </dt>
                <dd>{equipment.warehouse.name}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Niederlassung
                </dt>
                <dd>{equipment.warehouse.branch.name}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">
                  Lageradresse
                </dt>
                <dd>{equipment.warehouse.address ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2">
            <h2 className="mb-3 text-lg font-semibold">Notizen</h2>

            <p className="whitespace-pre-wrap text-base-content/80">
              {equipment.notes || "Keine Notizen vorhanden."}
            </p>
          </section>
        </div>
      </DetailLayout>
    </motion.div>
  );
}
