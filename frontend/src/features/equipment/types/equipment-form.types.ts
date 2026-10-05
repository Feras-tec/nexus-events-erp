export type ProductOption = {
  id: string;
  productNo: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  isActive: boolean;
};

export type WarehouseOption = {
  id: string;
  name: string;
  isActive: boolean;
  branch: {
    id: string;
    name: string;
  };
};

export type EquipmentFormValues = {
  assetNo: string;
  manufacturerSerial: string;
  barcode: string;
  status:
    | "RECEIVED"
    | "AVAILABLE"
    | "RESERVED"
    | "PICKING"
    | "PACKED"
    | "IN_TRANSIT"
    | "AT_EVENT"
    | "RETURNING"
    | "INSPECTION"
    | "DAMAGED"
    | "MAINTENANCE"
    | "REPAIRED"
    | "LOST"
    | "RETIRED";
  location: string;
  purchaseDate: string;
  purchasePrice: string;
  notes: string;
  productId: string;
  warehouseId: string;
};
