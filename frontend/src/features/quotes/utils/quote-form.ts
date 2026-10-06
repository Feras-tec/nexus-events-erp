import type {
  Quote,
  QuoteFormData,
} from "../types/quote.types";

function toDateInputValue(value?: string | null) {
  if (!value) return "";

  return value.slice(0, 10);
}

export function quoteToFormData(
  quote: Quote,
): QuoteFormData {
  return {
    quoteNo: quote.quoteNo,
    status: quote.status,
    validUntil: toDateInputValue(quote.validUntil),
    notes: quote.notes ?? "",
    customerId: quote.customerId,
    eventId: quote.eventId ?? "",
    tax: String(quote.tax),
    discount: String(quote.discount),

    items: quote.items.map((item) => ({
      type: item.type,
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
      discount: String(item.discount),
      productId: item.productId ?? "",
    })),
  };
}
