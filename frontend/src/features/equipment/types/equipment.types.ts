import type {
  EquipmentFormValues,
  ProductOption,
  WarehouseOption,
} from "../../../components/organisms/EquipmentForm";

export type EquipmentDetail = {
  id: string;
  assetNo: string;
  manufacturerSerial?: string | null;
  barcode?: string | null;
  status: EquipmentFormValues["status"];
  location?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: string | number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  productId: string;
  warehouseId: string;

  product: ProductOption & {
    category?: string | null;
    description?: string | null;
    trackingType: "SERIALIZED" | "QUANTITY";
    usageType: "RENTAL" | "SALE" | "BOTH";
  };

  warehouse: WarehouseOption & {
    code?: string;
    address?: string | null;
  };
};

export type EquipmentResponse = {
  data: EquipmentDetail;
};

export type ProductsResponse = {
  data: ProductOption[];
};

export type WarehousesResponse = {
  data: WarehouseOption[];
};

export type EmployeeOption = {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  position?: string | null;
  status: string;
};

export type EmployeesResponse = {
  data: EmployeeOption[];
};

export type EquipmentMovement = {
  id: string;
  type:
    | "RECEIVED"
    | "RESERVED"
    | "RELEASED"
    | "PICKED"
    | "PACKED"
    | "LOADED"
    | "TRANSFERRED"
    | "DELIVERED_TO_EVENT"
    | "RETURNED_FROM_EVENT"
    | "INSPECTION"
    | "MAINTENANCE"
    | "REPAIRED"
    | "LOST"
    | "RECOVERED"
    | "RETIRED"
    | "MANUAL_ADJUSTMENT";
  fromStatus?: EquipmentFormValues["status"] | null;
  toStatus: EquipmentFormValues["status"];
  fromLocation?: string | null;
  toLocation?: string | null;
  notes?: string | null;
  createdAt: string;

  reservation?: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    event: {
      id: string;
      eventNo: string;
      name: string;
      location?: string | null;
      customer: {
        id: string;
        customerNo: string;
        companyName?: string | null;
        firstName?: string | null;
        lastName?: string | null;
      };
    };
  } | null;

  responsibleEmployee?: {
    id: string;
    employeeNo: string;
    firstName: string;
    lastName: string;
    position?: string | null;
  } | null;

  fromWarehouse?: WarehouseOption | null;
  toWarehouse?: WarehouseOption | null;
};

export type EquipmentMovementsResponse = {
  inventoryItem: {
    id: string;
    assetNo: string;
  };
  movements: EquipmentMovement[];
};
