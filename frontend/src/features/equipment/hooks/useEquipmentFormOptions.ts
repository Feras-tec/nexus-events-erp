import { useAppAuth } from "../../auth/AppAuthProvider";
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

type UseEquipmentFormOptionsOptions = {
  enabled?: boolean;
};

export function useEquipmentFormOptions({
  enabled = true,
}: UseEquipmentFormOptionsOptions = {}) {
  const { getToken } = useAppAuth();

  const productsQuery = useQuery({
    queryKey: ["products"],
    enabled,
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/products", token);
      const result = (await response.json()) as ProductsResponse;

      return result.data;
    },
  });

  const warehousesQuery = useQuery({
    queryKey: ["warehouses"],
    enabled,
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
