import { StatusChip } from "../atoms/StatusChip";

type EquipmentItem = {
  id: string;
  assetNo: string;
  manufacturerSerial?: string | null;
  barcode?: string | null;
  status: string;
  location?: string | null;

  product: {
    id: string;
    productNo: string;
    name: string;
    brand?: string | null;
    model?: string | null;
  };

  warehouse: {
    id: string;
    name: string;
    branch: {
      id: string;
      name: string;
    };
  };
};

type EquipmentTableProps = {
  equipment: EquipmentItem[];
  onView?: (equipmentId: string) => void;
};

export function EquipmentTable({
  equipment,
  onView,
}: EquipmentTableProps) {
  if (equipment.length === 0) {
    return (
      <div className="rounded-box border border-base-300 bg-base-100 p-8 text-center">
        <p className="text-base-content/60">
          Keine Geräte gefunden.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table className="table">
        <thead>
          <tr>
            <th>Gerät</th>
            <th>Asset-Nr.</th>
            <th>Seriennummer</th>
            <th>Lager</th>
            <th>Standort</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Aktionen</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {equipment.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="font-medium">
                  {item.product.name}
                </div>

                {(item.product.brand || item.product.model) && (
                  <div className="text-xs text-base-content/60">
                    {[item.product.brand, item.product.model]
                      .filter(Boolean)
                      .join(" ")}
                  </div>
                )}
              </td>

              <td>{item.assetNo}</td>

              <td>{item.manufacturerSerial ?? "—"}</td>

              <td>
                <div>{item.warehouse.name}</div>
                <div className="text-xs text-base-content/60">
                  {item.warehouse.branch.name}
                </div>
              </td>

              <td>{item.location ?? "—"}</td>

              <td>
                <StatusChip status={item.status} />
              </td>

              <td className="text-right">
                {onView && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onView(item.id)}
                  >
                    Anzeigen
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
