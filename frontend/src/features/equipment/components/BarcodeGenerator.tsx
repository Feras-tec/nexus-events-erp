import { useRef, useState, type FormEvent } from "react";
import { BarcodeLabels } from "./BarcodeLabels";
import type {
  ProductOption,
  WarehouseOption,
} from "../types/equipment-form.types";
import {
  useGenerateBarcodes,
  type GenerateBarcodesInput,
  type GenerateBarcodesResponse,
} from "../hooks/useGenerateBarcodes";

// Eigenschaften der Barcode-Oberfläche
type BarcodeGeneratorProps = {
  products: ProductOption[];
  warehouses: WarehouseOption[];
};

// Formularzustand und Generierung verwalten
export function BarcodeGenerator({
  products,
  warehouses,
}: BarcodeGeneratorProps) {
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [result, setResult] =
    useState<GenerateBarcodesResponse | null>(null);

  const pendingRequest = useRef<GenerateBarcodesInput | null>(null);
  const { generateBarcodesMutation } = useGenerateBarcodes();

  // Wiederholte Anfragen verwenden denselben Schlüssel
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (generateBarcodesMutation.isPending) return;

    const input = pendingRequest.current ?? {
      productId,
      warehouseId,
      quantity,
      idempotencyKey: crypto.randomUUID(),
    };

    pendingRequest.current = input;

    try {
      const response = await generateBarcodesMutation.mutateAsync(input);
      setResult(response);
      pendingRequest.current = null;
    } catch {
      // Der Schlüssel bleibt für einen erneuten Versuch erhalten.
    }
  }

  // Neue Eingaben beginnen eine neue Anfrage
  function resetRequest() {
    pendingRequest.current = null;
    setResult(null);
    generateBarcodesMutation.reset();
  }

  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-5">
      <h2 className="mb-2 text-xl font-semibold">
        Barcodes generieren
      </h2>

      <p className="mb-5 text-sm text-base-content/70">
        Neue Geräte müssen vor der Verwendung per Barcode
        im Lager eingebucht werden.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
        <label className="fieldset">
          <span className="fieldset-legend">Produkt</span>
          <select
            className="select w-full"
            value={productId}
            onChange={(event) => {
              setProductId(event.target.value);
              resetRequest();
            }}
            disabled={generateBarcodesMutation.isPending}
            required
          >
            <option value="">Produkt auswählen</option>
            {products.filter((product) => product.isActive).map((product) => (
              <option key={product.id} value={product.id}>
                {product.productNo} – {product.name}
              </option>
            ))}
          </select>
        </label>

        <label className="fieldset">
          <span className="fieldset-legend">Lager</span>
          <select
            className="select w-full"
            value={warehouseId}
            onChange={(event) => {
              setWarehouseId(event.target.value);
              resetRequest();
            }}
            disabled={generateBarcodesMutation.isPending}
            required
          >
            <option value="">Lager auswählen</option>
            {warehouses.filter((warehouse) => warehouse.isActive).map(
              (warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} – {warehouse.branch.name}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="fieldset">
          <span className="fieldset-legend">Anzahl</span>
          <input
            className="input w-full"
            type="number"
            min={1}
            max={1000}
            step={1}
            value={quantity}
            onChange={(event) => {
              setQuantity(Number(event.target.value));
              resetRequest();
            }}
            disabled={generateBarcodesMutation.isPending}
            required
          />
        </label>

        <div className="md:col-span-3">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={generateBarcodesMutation.isPending}
          >
            {generateBarcodesMutation.isPending
              ? "Barcodes werden erstellt ..."
              : pendingRequest.current
                ? "Generierung erneut versuchen"
                : "Barcodes generieren"}
          </button>
        </div>
      </form>

      {generateBarcodesMutation.isError && (
        <div role="alert" className="alert alert-error mt-4">
          Die Generierung ist fehlgeschlagen.
          Bitte versuchen Sie es erneut.
        </div>
      )}

      {result && (
        <div role="status" className="alert alert-success mt-4">
          <span>
            {result.count} Barcodes erfolgreich geladen.
            {result.reused
              ? " Eine vorhandene Charge wurde wiederverwendet."
              : ""}
            {" "}Die Geräte sind noch nicht im Lager eingebucht.
          </span>
        </div>
      )}

      {result && result.data.length > 0 && (
        <BarcodeLabels items={result.data} />
      )}
    </section>
  );
}
