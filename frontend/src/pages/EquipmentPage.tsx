import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import {
  EquipmentForm,
  type EquipmentFormValues,
  type ProductOption,
  type WarehouseOption,
} from "../components/organisms/EquipmentForm";
import { EquipmentTable } from "../components/organisms/EquipmentTable";
import { ListLayout } from "../components/templates/ListLayout";
import { apiFetch } from "../services/api";

type InventoryItem = {
  id: string;
  assetNo: string;
  manufacturerSerial?: string | null;
  barcode?: string | null;
  status: string;
  location?: string | null;
  product: {
    id: string;
    productNo: string;
    name: string;
    brand?: string | null;
    model?: string | null;
  };
  warehouse: {
    id: string;
    name: string;
    branch: {
      id: string;
      name: string;
    };
  };
};

type EquipmentResponse = {
  data: InventoryItem[];
};

type ProductsResponse = {
  data: ProductOption[];
};

type WarehousesResponse = {
  data: WarehouseOption[];
};

export function EquipmentPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    data: equipment = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/inventory-items", token);
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

  const createEquipmentMutation = useMutation({
    mutationFn: async (data: EquipmentFormValues) => {
      const token = await getToken();

      const payload = {
        assetNo: data.assetNo.trim(),
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
        productId: data.productId,
        warehouseId: data.warehouseId,
      };

      const response = await apiFetch("/api/inventory-items", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["products"],
        }),
      ]);

      setShowCreateForm(false);
    },
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
        title="Equipment"
        description="Equipment und Lagerbestand verwalten."
        searchValue={search}
        searchPlaceholder="Equipment suchen..."
        onSearchChange={setSearch}
        actions={
          <Button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
          >
            {showCreateForm ? "Abbrechen" : "Neues Gerät"}
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
                    aria-label="Formulardaten werden geladen"
                  />
                </div>
              )}

              {formDataError && (
                <div role="alert" className="alert alert-error">
                  Produkte oder Lager konnten nicht geladen werden.
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
                  Gerät konnte nicht erstellt werden.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-center py-12">
            <span
              className="loading loading-spinner loading-lg"
              aria-label="Equipment wird geladen"
            />
          </div>
        )}

        {isError && (
          <div role="alert" className="alert alert-error">
            Equipment konnte nicht geladen werden.
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
