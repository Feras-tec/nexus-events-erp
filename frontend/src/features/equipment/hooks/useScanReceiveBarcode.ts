import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../services/api";

// Eingabedaten für den Barcode-Wareneingang
export type ScanReceiveBarcodeInput = {
  barcode: string;
  responsibleEmployeeId?: string;
};

// Erfolgreich registrierter Inventarartikel
export type ReceivedBarcodeItem = {
  id: string;
  assetNo: string;
  barcode: string;
  status: "AVAILABLE";
};

// Antwort des Backends nach erfolgreichem Wareneingang
export type ScanReceiveBarcodeResponse = {
  success: true;
  message: string;
  data: ReceivedBarcodeItem;
};

// Verarbeitet den Barcode-Wareneingang und aktualisiert die Inventarliste
export function useScanReceiveBarcode() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const scanReceiveBarcodeMutation = useMutation({
    mutationFn: async (input: ScanReceiveBarcodeInput) => {
      const token = await getToken();

      const response = await apiFetch(
        "/api/inventory-items/scan-receive",
        token,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      );

      return (await response.json()) as ScanReceiveBarcodeResponse;
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["equipment"],
      });
    },
  });

  return { scanReceiveBarcodeMutation };
}
