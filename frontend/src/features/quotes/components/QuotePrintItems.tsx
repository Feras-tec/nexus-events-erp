import type { QuoteItem } from "../types/quote.types";
import { formatQuotePrintCurrency } from "../utils/quote-print";

type QuotePrintItemsProps = {
  items: QuoteItem[];
};

export function QuotePrintItems({
  items,
}: QuotePrintItemsProps) {
  return (
    <table className="w-full table-fixed border-collapse text-sm">
      <colgroup>
        <col style={{ width: "7%" }} />
        <col style={{ width: "43%" }} />
        <col style={{ width: "9%" }} />
        <col style={{ width: "16%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "15%" }} />
      </colgroup>
      <thead>
        <tr className="border-b-2 border-base-content">
          <th className="py-2 text-left">Pos.</th>
          <th className="py-2 text-left">Beschreibung</th>
          <th className="whitespace-nowrap py-2 text-right">Menge</th>
          <th className="whitespace-nowrap py-2 text-right">Einzelpreis</th>
          <th className="whitespace-nowrap py-2 text-right">Rabatt</th>
          <th className="whitespace-nowrap py-2 text-right">Gesamt</th>
        </tr>
      </thead>

      <tbody>
        {items.map((item, index) => (
          <tr
            key={item.id}
            className="border-b border-base-300"
          >
            <td className="py-3 align-top">
              {index + 1}
            </td>

            <td className="py-3 align-top">
              <div className="font-medium">
                {item.description}
              </div>

              <div className="text-xs opacity-60">
                {item.type}
              </div>
            </td>

            <td className="whitespace-nowrap py-3 text-right align-top">
              {item.quantity}
            </td>

            <td className="whitespace-nowrap py-3 text-right align-top">
              {formatQuotePrintCurrency(
                Number(item.unitPrice),
              )}
            </td>

            <td className="whitespace-nowrap py-3 text-right align-top">
              {Number(item.discount)} %
            </td>

            <td className="whitespace-nowrap py-3 text-right align-top font-medium">
              {formatQuotePrintCurrency(
                Number(item.total),
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
