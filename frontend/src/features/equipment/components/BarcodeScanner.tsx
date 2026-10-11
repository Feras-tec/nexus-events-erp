import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { useScanReceiveBarcode } from "../hooks/useScanReceiveBarcode";

// Formular für den Barcode-Wareneingang
export function BarcodeScanner() {
  const { t } = useTranslation();
  const [barcode, setBarcode] = useState("");
  const [lastReceived, setLastReceived] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);
  const scannerSessionRef = useRef(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { scanReceiveBarcodeMutation } = useScanReceiveBarcode();

  // Eingabefeld nach erfolgreichem Wareneingang erneut fokussieren
  useEffect(() => {
    inputRef.current?.focus();
  }, [lastReceived]);

  // Laufende Kamera und Barcode-Erkennung beenden
  const stopCamera = () => {
    scannerSessionRef.current += 1;
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    setCameraOpen(false);
  };

  // Kamera beim Entfernen der Komponente sicher freigeben
  useEffect(() => {
    return () => {
      scannerSessionRef.current += 1;
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
    };
  }, []);

  // Rückkamera öffnen und ausschließlich CODE128-Barcodes erkennen
  const startCamera = async () => {
    if (cameraOpen) return;

    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t("barcodeScanner.cameraUnavailable"));
      return;
    }

    const session = ++scannerSessionRef.current;
    setCameraOpen(true);

    // Auf das Einfügen des Videoelements in die Oberfläche warten
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    if (session !== scannerSessionRef.current || !videoRef.current) return;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
    const reader = new BrowserMultiFormatReader(hints);

    try {
      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        },
        videoRef.current,
        (result) => {
          if (!result || session !== scannerSessionRef.current) return;

          const scannedBarcode = result.getText().trim();

          if (!scannedBarcode) return;

          setBarcode(scannedBarcode);
          stopCamera();
        },
      );

      if (session !== scannerSessionRef.current) {
        controls.stop();
        return;
      }

      scannerControlsRef.current = controls;
    } catch {
      if (session !== scannerSessionRef.current) return;

      setCameraError(t("barcodeScanner.cameraError"));
      stopCamera();
    }
  };

  // Barcode über Scanner oder manuelle Eingabe verarbeiten
  const handleReceive = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = barcode.trim();

    if (!value || scanReceiveBarcodeMutation.isPending) {
      return;
    }

    setLastReceived(null);

    try {
      const result = await scanReceiveBarcodeMutation.mutateAsync({
        barcode: value,
      });

      setLastReceived(result.data.assetNo);
      setBarcode("");
    } catch {
      // Die Fehlermeldung wird über den Mutation-Status angezeigt.
    } finally {
      inputRef.current?.focus();
    }
  };

  // HTTP-Fehler beim Barcode-Wareneingang verständlich anzeigen
  const getErrorMessage = () => {
    const error = scanReceiveBarcodeMutation.error;

    if (!error) return null;

    const status = error.message.match(/API-Fehler: (\\d{3})/)?.[1];

    switch (status) {
      case "400":
        return t("barcodeScanner.error400");
      case "401":
        return t("barcodeScanner.error401");
      case "403":
        return t("barcodeScanner.error403");
      case "404":
        return t("barcodeScanner.error404");
      case "409":
        return t("barcodeScanner.error409");
      case "500":
        return t("barcodeScanner.error500");
      default:
        return t("barcodeScanner.errorDefault");
    }
  };

  return (
    <section className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 className="mb-2 text-xl font-semibold">
        {t("barcodeScanner.title")}
      </h2>

      <p className="mb-5 text-sm text-base-content/70">
        {t("barcodeScanner.description")}
      </p>

      <div className="mb-5">
        <button
          type="button"
          className="btn btn-outline"
          onClick={cameraOpen ? stopCamera : startCamera}
        >
          {cameraOpen ? t("barcodeScanner.closeCamera") : t("barcodeScanner.openCamera")}
        </button>

        {cameraOpen && (
          <div className="mt-4 max-w-lg overflow-hidden rounded-xl border border-base-300">
            <video
              ref={videoRef}
              className="aspect-video w-full bg-black object-cover"
              autoPlay
              muted
              playsInline
            />
            <p className="p-3 text-sm">
              {t("barcodeScanner.cameraHint")}
            </p>
          </div>
        )}

        {cameraError && (
          <div role="alert" className="alert alert-error mt-3">
            {cameraError}
          </div>
        )}
      </div>

      <form onSubmit={handleReceive} className="flex flex-wrap items-end gap-3">
        <label className="form-control min-w-60 flex-1">
          <span className="mb-2 block text-sm font-medium">
            {t("barcodeScanner.barcode")}
          </span>

          <input
            ref={inputRef}
            type="text"
            className="input input-bordered w-full"
            placeholder={t("barcodeScanner.placeholder")}
            value={barcode}
            onChange={(event) => setBarcode(event.target.value)}
            disabled={scanReceiveBarcodeMutation.isPending}
            autoComplete="off"
            required
          />
        </label>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!barcode.trim() || scanReceiveBarcodeMutation.isPending}
        >
          {scanReceiveBarcodeMutation.isPending
            ? t("barcodeScanner.processing")
            : t("barcodeScanner.confirm")}
        </button>
      </form>

      {lastReceived && (
        <div role="status" className="alert alert-success mt-5">
          {t("barcodeScanner.success", { assetNo: lastReceived })}
        </div>
      )}

      {scanReceiveBarcodeMutation.isError && (
        <div role="alert" className="alert alert-error mt-5">
          {getErrorMessage()}
        </div>
      )}
    </section>
  );
}
