export type CustomerFormData = {
  customerNo: string;
  type: "COMPANY" | "PRIVATE";
  companyName: string;
  firstName: string;
  lastName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  vatId: string;
  discount: string;
};

export type CustomerFormErrors = Partial<
  Record<keyof CustomerFormData, string>
>;
