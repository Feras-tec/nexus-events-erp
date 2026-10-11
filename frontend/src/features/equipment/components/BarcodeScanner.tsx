import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { useScanReceiveBarcode } from "../hooks/useScanReceiveBarcode";

// Formular für den Barcode-Wareneingang
export function BarcodeScanner() {
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
      setCameraError("Kamera nicht verfügbar. Bitte HTTPS oder localhost verwenden.");
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

      setCameraError("Kamera konnte nicht gestartet werden. Bitte Berechtigung prüfen.");
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
        return "Ungültiger Barcode. Bitte Eingabe überprüfen.";
      case "401":
        return "Bitte erneut anmelden.";
      case "403":
        return "Keine Berechtigung für den Wareneingang.";
      case "404":
        return "Barcode wurde nicht gefunden.";
      case "409":
        return "Dieser Artikel wurde bereits registriert oder ist nicht zur Registrierung vorgemerkt.";
      case "500":
        return "Serverfehler. Bitte später erneut versuchen.";
      default:
        return "Wareneingang fehlgeschlagen. Bitte Verbindung prüfen und erneut versuchen.";
    }
  };

  return (
    <section className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 className="mb-2 text-xl font-semibold">
        Barcode-Wareneingang
      </h2>

      <p className="mb-5 text-sm text-base-content/70">
        Barcode mit der Handykamera, einem USB-Scanner oder manuell erfassen.
        Der Artikel wird nach erfolgreicher Prüfung als verfügbar registriert.
      </p>

      <div className="mb-5">
        <button
          type="button"
          className="btn btn-outline"
          onClick={cameraOpen ? stopCamera : startCamera}
        >
          {cameraOpen ? "Kamera schließen" : "Kamera öffnen"}
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
              Barcode vor die Kamera halten. Die Erkennung erfolgt automatisch.
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
            Barcode
          </span>

          <input
            ref={inputRef}
            type="text"
            className="input input-bordered w-full"
            placeholder="Barcode scannen oder eingeben"
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
            ? "Wird registriert..."
            : "Wareneingang bestätigen"}
        </button>
      </form>

      {lastReceived && (
        <div role="status" className="alert alert-success mt-5">
          Artikel {lastReceived} erfolgreich registriert.
          Status: Verfügbar.
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
