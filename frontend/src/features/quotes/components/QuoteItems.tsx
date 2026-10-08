import { useTranslation } from "react-i18next";
import type { ProductTableItem } from "../../../components/organisms/ProductTable";
import type { QuoteFormItem } from "../types/quote.types";
import { QuoteItemRow } from "./QuoteItemRow";

type QuoteItemsProps = {
  items: QuoteFormItem[];
  products: ProductTableItem[];
  loading?: boolean;
  onChange: (items: QuoteFormItem[]) => void;
};

function createEmptyItem(): QuoteFormItem {
  return {
    type: "EQUIPMENT",
    description: "",
    quantity: "1",
    unitPrice: "0",
    discount: "0",
    productId: "",
  };
}

export function QuoteItems({
  items,
  products,
  loading = false,
  onChange,
}: QuoteItemsProps) {
  const { t } = useTranslation();

  function handleItemChange(
    index: number,
    updatedItem: QuoteFormItem,
  ) {
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index ? updatedItem : item,
      ),
    );
  }

  function handleRemove(index: number) {
    if (items.length <= 1) return;

    onChange(
      items.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function handleAdd() {
    onChange([...items, createEmptyItem()]);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {t("quotes.items.title")}
          </h2>

          <p className="text-sm text-base-content/60">
            {t("quotes.items.description")}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline"
          disabled={loading}
          onClick={handleAdd}
        >
          + {t("quotes.items.add")}
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <QuoteItemRow
            key={index}
            item={item}
            index={index}
            products={products}
            loading={loading}
            canRemove={items.length > 1}
            onChange={handleItemChange}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </section>
  );
}
