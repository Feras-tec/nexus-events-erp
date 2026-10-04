import { useState } from "react";
import { useAuth } from "@clerk/react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import {
  ProductForm,
  type ProductFormValues,
} from "../components/organisms/ProductForm";
import {
  ProductTable,
  type ProductTableItem,
} from "../components/organisms/ProductTable";
import { ListLayout } from "../components/templates/ListLayout";
import { apiFetch } from "../services/api";

type ProductsResponse = {
  data: ProductTableItem[];
};

export function ProductsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/products", token);
      const result = (await response.json()) as ProductsResponse;

      return result.data;
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const token = await getToken();

      const payload = {
        productNo: data.productNo.trim(),
        name: data.name.trim(),
        brand: data.brand.trim() || undefined,
        model: data.model.trim() || undefined,
        category: data.category.trim() || undefined,
        description: data.description.trim() || undefined,
        trackingType: data.trackingType,
        usageType: data.usageType,
      };

      const response = await apiFetch("/api/products", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return response.json();
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["products"],
      });

      setShowCreateForm(false);
    },
  });

  const normalizedSearch = search.trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    if (!normalizedSearch) return true;

    const searchableText = [
      product.productNo,
      product.name,
      product.brand,
      product.model,
      product.category,
      product.trackingType,
      product.usageType,
      product.isActive ? "active aktiv" : "inactive inaktiv",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <ListLayout
        title="Produkte"
        description="Produkttypen für Equipment und Lagerbestand verwalten."
        searchValue={search}
        searchPlaceholder="Produkte suchen..."
        onSearchChange={setSearch}
        actions={
          <Button
            type="button"
            onClick={() =>
              setShowCreateForm((current) => !current)
            }
          >
            {showCreateForm ? "Abbrechen" : "Neues Produkt"}
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
              <ProductForm
                loading={createProductMutation.isPending}
                onSubmit={(data) =>
                  createProductMutation.mutate(data)
                }
              />

              {createProductMutation.isError && (
                <div
                  role="alert"
                  className="alert alert-error mt-4"
                >
                  Produkt konnte nicht erstellt werden.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-center py-12">
            <span
              className="loading loading-spinner loading-lg"
              aria-label="Produkte werden geladen"
            />
          </div>
        )}

        {isError && (
          <div role="alert" className="alert alert-error">
            Produkte konnten nicht geladen werden.
          </div>
        )}

        {!isLoading && !isError && (
          <ProductTable
            products={filteredProducts}
            onView={(productId) => {
              navigate({
                to: "/products/$productId",
                params: {
                  productId,
                },
              });
            }}
          />
        )}
      </ListLayout>
    </motion.div>
  );
}
