import type {
  BranchOption,
  DepartmentOption,
} from "../../../components/organisms/EmployeeForm";

export type EmployeeDetail = {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  nationality?: string | null;
  position?: string | null;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "SUSPENDED";

  branch: {
    id: string;
    code: string;
    name: string;
    city: string;
    isActive: boolean;
    company?: {
      id: string;
      name: string;
    };
  };

  department?: {
    id: string;
    name: string;
    branchId: string;
    isActive: boolean;
  } | null;

  employmentPeriods: {
    id: string;
    startDate: string;
    endDate?: string | null;
    position?: string | null;
    reason?: string | null;
    createdAt: string;
    updatedAt: string;
    employeeId: string;
  }[];

  documents: {
    id: string;
    type:
      | "RESIDENCE_PERMIT"
      | "WORK_PERMIT"
      | "PASSPORT"
      | "CONTRACT"
      | "OTHER";
    documentNumber?: string | null;
    issueDate?: string | null;
    expiryDate?: string | null;
    fileUrl?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    employeeId: string;
  }[];
};

export type EmployeeResponse = {
  data: EmployeeDetail;
};

export type BranchesResponse = {
  data: BranchOption[];
};

export type DepartmentsResponse = {
  data: DepartmentOption[];
};
