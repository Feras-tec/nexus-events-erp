import { useTranslation } from "react-i18next";
import type { ProductTableItem } from "../../../components/organisms/ProductTable";
import type {
  QuoteFormItem,
  QuoteItemType,
} from "../types/quote.types";
import {
  calculateQuoteItemTotal,
  formatQuoteCurrency,
} from "../utils/quote-calculations";

type QuoteItemRowProps = {
  item: QuoteFormItem;
  index: number;
  products: ProductTableItem[];
  loading?: boolean;
  canRemove: boolean;
  onChange: (index: number, item: QuoteFormItem) => void;
  onRemove: (index: number) => void;
};

const itemTypes: {
  value: QuoteItemType;
}[] = [
  { value: "EQUIPMENT" },
  { value: "SERVICE" },
  { value: "TRANSPORT" },
  { value: "PERSONNEL" },
  { value: "OTHER" },
];

export function QuoteItemRow({
  item,
  index,
  products,
  loading = false,
  canRemove,
  onChange,
  onRemove,
}: QuoteItemRowProps) {
  const { t, i18n } = useTranslation();

  function update(
    field: keyof QuoteFormItem,
    value: string,
  ) {
    onChange(index, {
      ...item,
      [field]: value,
    });
  }

  function handleProductChange(productId: string) {
    const product = products.find(
      (entry) => entry.id === productId,
    );

    onChange(index, {
      ...item,
      productId,
      description:
        product && !item.description
          ? product.name
          : item.description,
    });
  }

  return (
    <div className="rounded-box border border-base-300 bg-base-200/30 p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="font-medium">
          {t("quotes.items.row", { number: index + 1 })}
        </span>

        <button
          type="button"
          className="btn btn-ghost btn-sm text-error"
          disabled={loading || !canRemove}
          onClick={() => onRemove(index)}
        >
          {t("quotes.items.remove")}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="form-control">
          <span className="label-text mb-2 font-medium">
            {t("quotes.items.type")}
          </span>

          <select
            className="select select-bordered w-full"
            value={item.type}
            disabled={loading}
            onChange={(event) =>
              update("type", event.target.value)
            }
          >
            {itemTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {t(`quotes.items.types.${type.value}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control lg:col-span-3">
          <span className="label-text mb-2 font-medium">
            {t("quotes.items.product")}
          </span>

          <select
            className="select select-bordered w-full"
            value={item.productId}
            disabled={loading}
            onChange={(event) =>
              handleProductChange(event.target.value)
            }
          >
            <option value="">
              {t("quotes.items.noProduct")}
            </option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.productNo} – {product.name}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control md:col-span-2 lg:col-span-4">
          <span className="label-text mb-2 font-medium">
            {t("quotes.items.itemDescription")}
          </span>

          <input
            type="text"
            className="input input-bordered w-full"
            maxLength={500}
            required
            disabled={loading}
            value={item.description}
            onChange={(event) =>
              update("description", event.target.value)
            }
          />
        </label>

        <label className="form-control">
          <span className="label-text mb-2 font-medium">
            {t("quotes.items.quantity")}
          </span>

          <input
            type="number"
            className="input input-bordered w-full"
            min="0.01"
            step="0.01"
            required
            disabled={loading}
            value={item.quantity}
            onChange={(event) =>
              update("quantity", event.target.value)
            }
          />
        </label>

        <label className="form-control">
          <span className="label-text mb-2 font-medium">
            {t("quotes.items.unitPrice")}
          </span>

          <input
            type="number"
            className="input input-bordered w-full"
            min="0"
            step="0.01"
            required
            disabled={loading}
            value={item.unitPrice}
            onChange={(event) =>
              update("unitPrice", event.target.value)
            }
          />
        </label>

        <label className="form-control">
          <span className="label-text mb-2 font-medium">
            {t("quotes.items.discount")}
          </span>

          <input
            type="number"
            className="input input-bordered w-full"
            min="0"
            max="100"
            step="0.01"
            disabled={loading}
            value={item.discount}
            onChange={(event) =>
              update("discount", event.target.value)
            }
          />
        </label>

        <div className="form-control">
          <span className="label-text mb-2 font-medium">
            {t("quotes.items.itemTotal")}
          </span>

          <div className="flex min-h-12 items-center rounded-btn border border-base-300 bg-base-200 px-4 font-semibold">
            {formatQuoteCurrency(
              calculateQuoteItemTotal(item),
              i18n.language,
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
