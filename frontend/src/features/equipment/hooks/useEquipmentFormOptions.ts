import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import type {
  ProductOption,
  WarehouseOption,
} from "../../../components/organisms/EquipmentForm";
import { apiFetch } from "../../../services/api";

type ProductsResponse = {
  data: ProductOption[];
};

type WarehousesResponse = {
  data: WarehouseOption[];
};

export function useEquipmentFormOptions() {
  const { getToken } = useAuth();

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/products", token);
      const result = (await response.json()) as ProductsResponse;

      return result.data;
    },
  });

  const warehousesQuery = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/warehouses", token);
      const result =
        (await response.json()) as WarehousesResponse;

      return result.data;
    },
  });

  return {
    products: productsQuery.data ?? [],
    productsLoading: productsQuery.isLoading,
    productsError: productsQuery.isError,

    warehouses: warehousesQuery.data ?? [],
    warehousesLoading: warehousesQuery.isLoading,
    warehousesError: warehousesQuery.isError,
  };
}
