import { useTranslation } from "react-i18next";
import type { InvoiceItem } from "../types/invoice.types";
import { formatInvoicePrintCurrency } from "../utils/invoice-print";

type InvoicePrintItemsProps = {
  items: InvoiceItem[];
};

export function InvoicePrintItems({
  items,
}: InvoicePrintItemsProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const locale = language.startsWith("ar") ? "ar" : language.startsWith("en") ? "en-GB" : "de-DE";

  return (
    <table className="invoice-print-items">
      <colgroup>
        <col style={{ width: "14%" }} />
        <col style={{ width: "32%" }} />
        <col style={{ width: "9%" }} />
        <col style={{ width: "18%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "17%" }} />
      </colgroup>

      <thead>
        <tr>
          <th>{t("invoices.print.type")}</th>
          <th>{t("invoices.print.description")}</th>
          <th className="number">{t("invoices.print.quantity")}</th>
          <th className="number">{t("invoices.print.unitPrice")}</th>
          <th className="number">{t("invoices.print.discount")}</th>
          <th className="number">{t("invoices.print.total")}</th>
        </tr>
      </thead>

      <tbody>
        {items.map((item, index) => (
          <tr key={item.id ?? index}>
            <td>{t(`invoices.itemTypes.${item.type}`, { defaultValue: item.type })}</td>
            <td>{item.description}</td>
            <td className="number">{item.quantity}</td>
            <td className="number">
              {formatInvoicePrintCurrency(item.unitPrice, locale)}
            </td>
            <td className="number">{item.discount} %</td>
            <td className="number">
              {formatInvoicePrintCurrency(item.total ?? 0, locale)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
