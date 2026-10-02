import { StatusChip } from "../atoms/StatusChip";

type EquipmentCardProps = {
  assetNo: string;
  productName: string;
  manufacturerSerial?: string | null;
  barcode?: string | null;
  status: string;
  location?: string | null;
  warehouseName?: string | null;
};

export function EquipmentCard({
  assetNo,
  productName,
  manufacturerSerial,
  barcode,
  status,
  location,
  warehouseName,
}: EquipmentCardProps) {
  return (
    <article className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{productName}</h3>
            <p className="text-sm text-base-content/60">{assetNo}</p>
          </div>

          <StatusChip status={status} />
        </div>

        <div className="mt-3 space-y-1 text-sm">
          {manufacturerSerial && (
            <p>
              <span className="font-medium">Seriennummer:</span>{" "}
              {manufacturerSerial}
            </p>
          )}

          {barcode && (
            <p>
              <span className="font-medium">Barcode:</span> {barcode}
            </p>
          )}

          {warehouseName && (
            <p>
              <span className="font-medium">Lager:</span> {warehouseName}
            </p>
          )}

          {location && (
            <p>
              <span className="font-medium">Standort:</span> {location}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
