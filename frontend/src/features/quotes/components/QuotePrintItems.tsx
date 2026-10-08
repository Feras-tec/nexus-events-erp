import { useTranslation } from "react-i18next";
import type { QuoteItem } from "../types/quote.types";
import { formatQuotePrintCurrency } from "../utils/quote-print";

type QuotePrintItemsProps = {
  items: QuoteItem[];
};

export function QuotePrintItems({
  items,
}: QuotePrintItemsProps) {
  const { t, i18n } = useTranslation();

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
          <th className="py-2 text-left">{t("quotes.print.position")}</th>
          <th className="py-2 text-left">{t("quotes.print.description")}</th>
          <th className="whitespace-nowrap py-2 text-right">{t("quotes.print.quantity")}</th>
          <th className="whitespace-nowrap py-2 text-right">{t("quotes.print.unitPrice")}</th>
          <th className="whitespace-nowrap py-2 text-right">{t("quotes.print.discount")}</th>
          <th className="whitespace-nowrap py-2 text-right">{t("quotes.print.total")}</th>
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
                {t(`quotes.items.types.${item.type}`)}
              </div>
            </td>

            <td className="whitespace-nowrap py-3 text-right align-top">
              {item.quantity}
            </td>

            <td className="whitespace-nowrap py-3 text-right align-top">
              {formatQuotePrintCurrency(
                Number(item.unitPrice),
                i18n.language,
              )}
            </td>

            <td className="whitespace-nowrap py-3 text-right align-top">
              {Number(item.discount)} %
            </td>

            <td className="whitespace-nowrap py-3 text-right align-top font-medium">
              {formatQuotePrintCurrency(
                Number(item.total),
                i18n.language,
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
