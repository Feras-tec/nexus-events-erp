export type BranchOption = {
  id: string;
  code: string;
  name: string;
  city: string;
  isActive: boolean;
};

export type DepartmentOption = {
  id: string;
  name: string;
  branchId: string;
  isActive: boolean;
};

export type EmployeeFormValues = {
  employeeNo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  nationality: string;
  position: string;
  branchId: string;
  departmentId: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "SUSPENDED";
};
