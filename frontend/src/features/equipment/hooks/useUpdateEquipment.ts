import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { EquipmentFormValues } from "../../../components/organisms/EquipmentForm";
import { apiFetch } from "../../../services/api";

type UseUpdateEquipmentParams = {
  equipmentId: string;
  onSuccess?: () => void;
};

export function useUpdateEquipment({
  equipmentId,
  onSuccess,
}: UseUpdateEquipmentParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const updateEquipmentMutation = useMutation({
    mutationFn: async (data: EquipmentFormValues) => {
      const token = await getToken();

      const payload = {
        manufacturerSerial: data.manufacturerSerial.trim() || undefined,
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

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        throw new Error(
          result?.error ?? "Gerät konnte nicht aktualisiert werden.",
        );
      }

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

      onSuccess?.();
    },
  });

  return {
    updateEquipmentMutation,
  };
}
