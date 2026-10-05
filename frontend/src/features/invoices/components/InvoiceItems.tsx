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
  const productOptions = products.map((product) => ({
    value: product.id,
    label: `${product.productNo} – ${product.name}`,
  }));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Rechnungspositionen
        </h2>

        <Button type="button" variant="ghost" onClick={onAdd}>
          + Position
        </Button>
      </div>

      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-box border border-base-300 bg-base-100 p-5"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Typ"
              value={item.type}
              options={itemTypes.map((type) => ({
                value: type,
                label: type,
              }))}
              onChange={(event) =>
                onUpdate(index, "type", event.target.value)
              }
            />

            <Select
              label="Produkt"
              value={item.productId ?? ""}
              options={productOptions}
              placeholder="Kein Produkt"
              onChange={(event) =>
                onUpdate(
                  index,
                  "productId",
                  event.target.value,
                )
              }
            />

            <Input
              label="Beschreibung"
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
              label="Menge"
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
              label="Einzelpreis"
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
              label="Rabatt %"
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
                Position entfernen
              </Button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
