export type CustomerOption = {
  id: string;
  customerNo: string;
  type: string;
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type EventDetail = {
  id: string;
  eventNo: string;
  name: string;
  type?: string | null;
  location?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  description?: string | null;
  customerId: string;

  customer: {
    id: string;
    customerNo: string;
    type?: string;
    companyName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
};

export type EventResponse = {
  data: EventDetail;
};
