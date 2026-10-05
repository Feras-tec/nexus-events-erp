import type { ReservationFormData } from "../../../components/organisms/ReservationForm";

export type ReservationDetail = {
  id: string;
  startDate: string;
  endDate: string;
  status: ReservationFormData["status"];
  notes?: string | null;
  eventId: string;
  inventoryItemId: string;

  event: {
    id: string;
    eventNo: string;
    name: string;
    type?: string | null;
    location?: string | null;
    startDate: string;
    endDate: string;
    status: string;
    customerId: string;

    customer: {
      id: string;
      customerNo: string;
      companyName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    };
  };

  inventoryItem: {
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
};

export type ApiError = {
  error?: string;
};
