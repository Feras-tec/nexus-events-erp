import type { ProductDetail } from "../types/product.types";

export function trackingLabel(
  value: ProductDetail["trackingType"],
) {
  return value === "SERIALIZED"
    ? "Einzelgerät / Seriennummer"
    : "Mengenartikel";
}

export function usageLabel(
  value: ProductDetail["usageType"],
) {
  if (value === "RENTAL") return "Vermietung";
  if (value === "SALE") return "Verkauf";

  return "Vermietung & Verkauf";
}
