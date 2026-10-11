import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import JsBarcode from "jsbarcode";
import type { GeneratedBarcodeItem } from "../hooks/useGenerateBarcodes";

// Einzelnes druckbares Barcode-Etikett
function BarcodeLabel({ item }: { item: GeneratedBarcodeItem }) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  // Barcode im Format CODE128 zeichnen
  useEffect(() => {
    if (!barcodeRef.current || !item.barcode) return;

    JsBarcode(barcodeRef.current, item.barcode, {
      format: "CODE128",
      width: 1.5,
      height: 55,
      displayValue: false,
      margin: 5,
    });
  }, [item.barcode]);

  return (
    <div className="rounded-lg border border-base-300 bg-white p-3 text-center text-black">
      <div className="text-xs font-bold">
        ZOOM EVENTS &amp; PRODUCTION
      </div>
      <svg ref={barcodeRef} className="mx-auto max-w-full" />
      <div className="text-xs font-medium">{item.assetNo}</div>
    </div>
  );
}

// Alle Etiketten einer generierten Charge anzeigen
export function BarcodeLabels({
  items,
}: {
  items: GeneratedBarcodeItem[];
}) {
  const { t } = useTranslation();

  return (
    <div className="mt-5" id="barcode-print-area">
      <div className="mb-4 flex justify-end print:hidden">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.print()}
        >
          {t("barcodeLabels.printLabels")}
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body * { visibility: hidden !important; }
          #barcode-print-area,
          #barcode-print-area * {
            visibility: visible !important;
          }
          #barcode-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
          }
          #barcode-label-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 4mm;
          }
          #barcode-label-grid > div {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div
        id="barcode-label-grid"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.filter((item) => item.barcode).map((item) => (
          <BarcodeLabel key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
