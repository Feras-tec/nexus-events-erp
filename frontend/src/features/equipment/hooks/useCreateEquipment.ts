import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { EquipmentFormValues } from "../../../components/organisms/EquipmentForm";
import { apiFetch } from "../../../services/api";

type UseCreateEquipmentParams = {
  onSuccess?: () => void;
};

export function useCreateEquipment({
  onSuccess,
}: UseCreateEquipmentParams = {}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

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

      const response = await apiFetch(
        "/api/inventory-items",
        token,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

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

      onSuccess?.();
    },
  });

  return {
    createEquipmentMutation,
  };
}
