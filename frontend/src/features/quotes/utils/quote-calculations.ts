import type { QuoteFormItem } from "../types/quote.types";

export function calculateQuoteItemTotal(item: QuoteFormItem) {
  const quantity = Number(item.quantity) || 0;
  const unitPrice = Number(item.unitPrice) || 0;
  const discount = Number(item.discount) || 0;

  return quantity * unitPrice * (1 - discount / 100);
}

export function calculateQuoteSubtotal(items: QuoteFormItem[]) {
  return items.reduce(
    (sum, item) => sum + calculateQuoteItemTotal(item),
    0,
  );
}

export function calculateQuoteTotals(
  items: QuoteFormItem[],
  discountValue: string,
  taxValue: string,
) {
  const subtotal = calculateQuoteSubtotal(items);

  const discount = Number(discountValue) || 0;
  const tax = Number(taxValue) || 0;

  const net = subtotal * (1 - discount / 100);
  const taxAmount = net * (tax / 100);
  const total = net + taxAmount;

  return {
    subtotal,
    discountAmount: subtotal - net,
    net,
    taxAmount,
    total,
  };
}

export function formatQuoteCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}
