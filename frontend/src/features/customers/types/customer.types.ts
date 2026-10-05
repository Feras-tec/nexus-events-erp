export type CustomerDetail = {
  id: string;
  customerNo: string;
  type: "COMPANY" | "PRIVATE";
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  vatId?: string | null;
  discount: number | string;
  isActive: boolean;
};

export type CustomerResponse = {
  data: CustomerDetail;
};
