import { StatusChip } from "../atoms/StatusChip";

type InvoiceSummaryProps = {
  invoiceNo: string;
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
  status: string;
};

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
}

export function InvoiceSummary({
  invoiceNo,
  subtotal,
  discount,
  tax,
  total,
  status,
}: InvoiceSummaryProps) {
  return (
    <section className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-base-content/60">Rechnung</p>
            <h3 className="font-semibold">{invoiceNo}</h3>
          </div>

          <StatusChip status={status} />
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Zwischensumme</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex justify-between">
            <span>Rabatt</span>
            <span>{formatCurrency(discount)}</span>
          </div>

          <div className="flex justify-between">
            <span>Steuer</span>
            <span>{formatCurrency(tax)}</span>
          </div>

          <div className="divider my-1" />

          <div className="flex justify-between text-base font-bold">
            <span>Gesamt</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
