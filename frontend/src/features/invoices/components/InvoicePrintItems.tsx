import type { InvoiceItem } from "../types/invoice.types";
import { formatInvoicePrintCurrency } from "../utils/invoice-print";

type InvoicePrintItemsProps = {
  items: InvoiceItem[];
};

export function InvoicePrintItems({
  items,
}: InvoicePrintItemsProps) {
  return (
    <table className="invoice-print-items">
      <colgroup>
        <col style={{ width: "7%" }} />
        <col style={{ width: "43%" }} />
        <col style={{ width: "9%" }} />
        <col style={{ width: "16%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "15%" }} />
      </colgroup>

      <thead>
        <tr>
          <th>Typ</th>
          <th>Beschreibung</th>
          <th className="number">Menge</th>
          <th className="number">Einzelpreis</th>
          <th className="number">Rabatt</th>
          <th className="number">Gesamt</th>
        </tr>
      </thead>

      <tbody>
        {items.map((item, index) => (
          <tr key={item.id ?? index}>
            <td>{item.type}</td>
            <td>{item.description}</td>
            <td className="number">{item.quantity}</td>
            <td className="number">
              {formatInvoicePrintCurrency(item.unitPrice)}
            </td>
            <td className="number">{item.discount} %</td>
            <td className="number">
              {formatInvoicePrintCurrency(item.total ?? 0)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
