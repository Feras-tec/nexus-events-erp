import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

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

export function EquipmentPage() {
  const { getToken } = useAuth();
  const [search, setSearch] = useState("");

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

  const normalizedSearch = search.trim().toLowerCase();

  const filteredEquipment = equipment.filter((item) => {
    if (!normalizedSearch) return true;

    const searchableText = [
      item.assetNo,
      item.product.name,
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

  return (
    <ListLayout
      title="Equipment"
      description="Equipment und Lagerbestand verwalten."
      searchValue={search}
      searchPlaceholder="Equipment suchen..."
      onSearchChange={setSearch}
    >
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
        <EquipmentTable equipment={filteredEquipment} />
      )}
    </ListLayout>
  );
}
