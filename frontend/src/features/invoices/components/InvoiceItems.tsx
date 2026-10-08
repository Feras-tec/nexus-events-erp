import { useTranslation } from "react-i18next";
import { Button } from "../../../components/atoms/Button";
import { Input } from "../../../components/atoms/Input";
import { Select } from "../../../components/atoms/Select";

import type {
  InvoiceItem,
  ProductOption,
} from "../types/invoice.types";

type InvoiceItemsProps = {
  items: InvoiceItem[];
  products: ProductOption[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (
    index: number,
    field: keyof InvoiceItem,
    value: string | number,
  ) => void;
};

const itemTypes = [
  "EQUIPMENT",
  "SERVICE",
  "TRANSPORT",
  "PERSONNEL",
  "OTHER",
];

export function InvoiceItems({
  items,
  products,
  onAdd,
  onRemove,
  onUpdate,
}: InvoiceItemsProps) {
  const { t } = useTranslation();
  const productOptions = products.map((product) => ({
    value: product.id,
    label: `${product.productNo} – ${product.name}`,
  }));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t("invoices.form.items")}
        </h2>

        <Button type="button" variant="ghost" onClick={onAdd}>
          + {t("invoices.form.addItem")}
        </Button>
      </div>

      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-box border border-base-300 bg-base-100 p-5"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Select
              label={t("invoices.detail.type")}
              value={item.type}
              options={itemTypes.map((type) => ({
                value: type,
                label: t(`invoices.itemTypes.${type}`),
              }))}
              onChange={(event) =>
                onUpdate(index, "type", event.target.value)
              }
            />

            <Select
              label={t("invoices.form.product")}
              value={item.productId ?? ""}
              options={productOptions}
              placeholder={t("invoices.form.noProduct")}
              onChange={(event) =>
                onUpdate(
                  index,
                  "productId",
                  event.target.value,
                )
              }
            />

            <Input
              label={t("invoices.detail.description")}
              value={item.description}
              required
              maxLength={500}
              onChange={(event) =>
                onUpdate(
                  index,
                  "description",
                  event.target.value,
                )
              }
            />

            <Input
              type="number"
              label={t("invoices.detail.quantity")}
              min={0.01}
              step="0.01"
              value={item.quantity}
              required
              onChange={(event) =>
                onUpdate(
                  index,
                  "quantity",
                  Number(event.target.value),
                )
              }
            />

            <Input
              type="number"
              label={t("invoices.detail.unitPrice")}
              min={0}
              step="0.01"
              value={item.unitPrice}
              required
              onChange={(event) =>
                onUpdate(
                  index,
                  "unitPrice",
                  Number(event.target.value),
                )
              }
            />

            <Input
              type="number"
              label={t("invoices.form.discountPercent")}
              min={0}
              max={100}
              value={item.discount}
              onChange={(event) =>
                onUpdate(
                  index,
                  "discount",
                  Number(event.target.value),
                )
              }
            />
          </div>

          {items.length > 1 && (
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="error"
                onClick={() => onRemove(index)}
              >
                {t("invoices.form.removeItem")}
              </Button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
