export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type InvoiceItemType =
  | "EQUIPMENT"
  | "SERVICE"
  | "TRANSPORT"
  | "PERSONNEL"
  | "OTHER";

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
  id?: string;
  type: InvoiceItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total?: number;
  productId?: string | null;
  product?: ProductOption | null;
};

export type InvoiceFormData = {
  invoiceNo: string;
  status: InvoiceStatus;
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


export type InvoiceCustomer = CustomerOption & {
  email?: string | null;
};

export type InvoiceEvent = EventOption;

export type InvoiceQuote = QuoteOption;

export type Invoice = {
  id: string;
  invoiceNo: string;
  status: InvoiceStatus;

  issueDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;

  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  customerId: string;
  eventId?: string | null;
  quoteId?: string | null;

  customer: InvoiceCustomer;
  event?: InvoiceEvent | null;
  quote?: InvoiceQuote | null;
  items: InvoiceItem[];

  createdAt: string;
  updatedAt: string;
};
