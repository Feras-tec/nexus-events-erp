export type CustomerOption = {
  id: string;
  customerNo: string;
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type EventOption = {
  id: string;
  eventNo: string;
  name: string;
};

export type QuoteOption = {
  id: string;
  quoteNo: string;
};

export type ProductOption = {
  id: string;
  productNo: string;
  name: string;
};

export type InvoiceItem = {
  type: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  productId?: string;
};

export type InvoiceFormData = {
  invoiceNo: string;
  status: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  customerId: string;
  eventId?: string;
  quoteId?: string;
  tax: number;
  discount: number;
  items: InvoiceItem[];
};
