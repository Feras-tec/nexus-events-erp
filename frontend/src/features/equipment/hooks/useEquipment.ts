import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

export type InventoryItem = {
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

export function useEquipment() {
  const { getToken } = useAuth();

  const query = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        "/api/inventory-items",
        token,
      );

      const result =
        (await response.json()) as EquipmentResponse;

      return result.data;
    },
  });

  return {
    equipment: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
