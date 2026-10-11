import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

// Eingabedaten für die Barcode-Generierung
export type GenerateBarcodesInput = {
  productId: string;
  warehouseId: string;
  quantity: number;
  idempotencyKey: string;
};

// Einzelnes generiertes Inventargerät
export type GeneratedBarcodeItem = {
  id: string;
  assetNo: string;
  barcode: string | null;
  status: string;
};

// Antwort des Backends nach der Generierung
export type GenerateBarcodesResponse = {
  batchId: string;
  data: GeneratedBarcodeItem[];
  count: number;
  reused: boolean;
};

// Erstellt Barcode-Chargen und aktualisiert die Inventarliste
export function useGenerateBarcodes() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const generateBarcodesMutation = useMutation({
    mutationFn: async (input: GenerateBarcodesInput) => {
      const token = await getToken();

      const response = await apiFetch(
        "/api/inventory-items/bulk-generate",
        token,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      );

      return (await response.json()) as GenerateBarcodesResponse;
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["equipment"],
      });
    },
  });

  return { generateBarcodesMutation };
}
