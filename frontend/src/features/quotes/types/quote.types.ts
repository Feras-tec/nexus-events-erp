export type QuoteStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type QuoteItemType =
  | "EQUIPMENT"
  | "SERVICE"
  | "TRANSPORT"
  | "PERSONNEL"
  | "OTHER";

export type QuoteCustomer = {
  id: string;
  customerNo: string;
  type: string;
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export type QuoteEvent = {
  id: string;
  eventNo: string;
  name: string;
};

export type QuoteProduct = {
  id: string;
  productNo: string;
  name: string;
};

export type QuoteItem = {
  id: string;
  type: QuoteItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  productId?: string | null;
  product?: QuoteProduct | null;
};

export type Quote = {
  id: string;
  quoteNo: string;
  status: QuoteStatus;
  validUntil?: string | null;
  notes?: string | null;
  lastSentAt?: string | null;
  lastSentTo?: string | null;

  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  customerId: string;
  eventId?: string | null;

  customer: QuoteCustomer;
  event?: QuoteEvent | null;
  items: QuoteItem[];

  createdAt: string;
  updatedAt: string;
};

export type QuoteFormItem = {
  type: QuoteItemType;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  productId: string;
};

export type QuoteFormData = {
  quoteNo: string;
  status: QuoteStatus;
  validUntil: string;
  notes: string;
  customerId: string;
  eventId: string;
  tax: string;
  discount: string;
  items: QuoteFormItem[];
};
