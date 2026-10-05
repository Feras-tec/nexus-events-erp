export type ProductDetail = {
  id: string;
  productNo: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  category?: string | null;
  description?: string | null;
  trackingType: "SERIALIZED" | "QUANTITY";
  usageType: "RENTAL" | "SALE" | "BOTH";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  inventoryItems: {
    id: string;
    assetNo: string;
    manufacturerSerial?: string | null;
    status: string;
    location?: string | null;
    warehouse: {
      id: string;
      name: string;
    };
  }[];
};

export type ProductResponse = {
  data: ProductDetail;
};
