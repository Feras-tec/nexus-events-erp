import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import { ProductForm } from "../components/organisms/ProductForm";
import { ProductTable } from "../components/organisms/ProductTable";
import { ListLayout } from "../components/templates/ListLayout";
import { useProducts } from "../features/products/hooks/useProducts";
import { useCreateProduct } from "../features/products/hooks/useCreateProduct";

export function ProductsPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    products,
    isLoading,
    isError,
  } = useProducts();

  const { createProductMutation } = useCreateProduct({
    onSuccess: () => setShowCreateForm(false),
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
