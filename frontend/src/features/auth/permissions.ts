import { APP_AUTH_MODE } from "./mode";
export const USER_ROLES = [
  "OWNER",
  "ADMIN",
  "HR_MANAGER",
  "ACCOUNTANT",
  "SALES_MANAGER",
  "PROJECT_MANAGER",
  "DEPARTMENT_MANAGER",
  "WAREHOUSE_MANAGER",
  "TECHNICIAN",
  "WAREHOUSE_EMPLOYEE",
  "SALES_EMPLOYEE",
  "EMPLOYEE",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type PermissionArea =
  | "dashboard"
  | "users"
  | "events"
  | "customers"
  | "employees"
  | "products"
  | "inventory"
  | "reservations"
  | "quotes"
  | "invoices";

export type PermissionAction =
  | "read"
  | "create"
  | "update"
  | "deactivate"
  | "send";

type AreaPermissions = Partial<
  Record<PermissionAction, readonly UserRole[]>
>;

const ALL_ROLES: readonly UserRole[] = USER_ROLES;

// Die Matrix spiegelt die requireRole-Aufrufe der Backend-Routen wider.
const permissions: Record<PermissionArea, AreaPermissions> = {
  dashboard: {
    read: ALL_ROLES,
  },
  // Auth-V2 nutzt /admin/users (OWNER/ADMIN); der explizite Clerk-Rückfall behält /api/users (OWNER).
  users: {
    read: APP_AUTH_MODE === "auth-v2" ? ["OWNER", "ADMIN"] : ["OWNER"],
  },
  events: {
    read: [
      "OWNER",
      "ADMIN",
      "PROJECT_MANAGER",
      "SALES_MANAGER",
      "SALES_EMPLOYEE",
      "DEPARTMENT_MANAGER",
      "WAREHOUSE_MANAGER",
      "TECHNICIAN",
    ],
    create: [
      "OWNER",
      "ADMIN",
      "PROJECT_MANAGER",
      "SALES_MANAGER",
    ],
    update: ["OWNER", "ADMIN", "PROJECT_MANAGER"],
  },
  customers: {
    read: [
      "OWNER",
      "ADMIN",
      "SALES_MANAGER",
      "SALES_EMPLOYEE",
      "PROJECT_MANAGER",
    ],
    create: [
      "OWNER",
      "ADMIN",
      "SALES_MANAGER",
      "SALES_EMPLOYEE",
      "PROJECT_MANAGER",
    ],
    update: [
      "OWNER",
      "ADMIN",
      "SALES_MANAGER",
      "SALES_EMPLOYEE",
      "PROJECT_MANAGER",
    ],
    deactivate: ["OWNER", "ADMIN", "SALES_MANAGER"],
  },
  employees: {
    read: ["OWNER", "ADMIN", "HR_MANAGER"],
    create: ["OWNER", "ADMIN", "HR_MANAGER"],
    update: ["OWNER", "ADMIN", "HR_MANAGER"],
    deactivate: ["OWNER", "ADMIN", "HR_MANAGER"],
  },
  products: {
    read: [
      "OWNER",
      "ADMIN",
      "WAREHOUSE_MANAGER",
      "WAREHOUSE_EMPLOYEE",
      "SALES_MANAGER",
      "SALES_EMPLOYEE",
      "PROJECT_MANAGER",
      "DEPARTMENT_MANAGER",
      "TECHNICIAN",
    ],
    create: ["OWNER", "ADMIN", "WAREHOUSE_MANAGER"],
    update: ["OWNER", "ADMIN", "WAREHOUSE_MANAGER"],
    deactivate: ["OWNER", "ADMIN", "WAREHOUSE_MANAGER"],
  },
  inventory: {
    read: [
      "OWNER",
      "ADMIN",
      "WAREHOUSE_MANAGER",
      "WAREHOUSE_EMPLOYEE",
      "PROJECT_MANAGER",
      "DEPARTMENT_MANAGER",
      "TECHNICIAN",
    ],
    create: ["OWNER", "ADMIN", "WAREHOUSE_MANAGER"],
    update: [
      "OWNER",
      "ADMIN",
      "WAREHOUSE_MANAGER",
      "WAREHOUSE_EMPLOYEE",
    ],
  },
  reservations: {
    read: [
      "OWNER",
      "ADMIN",
      "PROJECT_MANAGER",
      "WAREHOUSE_MANAGER",
      "WAREHOUSE_EMPLOYEE",
      "DEPARTMENT_MANAGER",
      "TECHNICIAN",
    ],
    create: [
      "OWNER",
      "ADMIN",
      "PROJECT_MANAGER",
      "WAREHOUSE_MANAGER",
    ],
    update: [
      "OWNER",
      "ADMIN",
      "PROJECT_MANAGER",
      "WAREHOUSE_MANAGER",
    ],
    deactivate: [
      "OWNER",
      "ADMIN",
      "PROJECT_MANAGER",
      "WAREHOUSE_MANAGER",
    ],
  },
  quotes: {
    read: [
      "OWNER",
      "ADMIN",
      "SALES_MANAGER",
      "SALES_EMPLOYEE",
      "PROJECT_MANAGER",
      "ACCOUNTANT",
    ],
    create: [
      "OWNER",
      "ADMIN",
      "SALES_MANAGER",
      "SALES_EMPLOYEE",
    ],
    update: [
      "OWNER",
      "ADMIN",
      "SALES_MANAGER",
      "SALES_EMPLOYEE",
    ],
    deactivate: [
      "OWNER",
      "ADMIN",
      "SALES_MANAGER",
      "SALES_EMPLOYEE",
    ],
    send: [
      "OWNER",
      "ADMIN",
      "SALES_MANAGER",
      "SALES_EMPLOYEE",
    ],
  },
  invoices: {
    read: [
      "OWNER",
      "ADMIN",
      "ACCOUNTANT",
      "SALES_MANAGER",
      "PROJECT_MANAGER",
    ],
    create: ["OWNER", "ADMIN", "ACCOUNTANT"],
    update: ["OWNER", "ADMIN", "ACCOUNTANT"],
    send: ["OWNER", "ADMIN", "ACCOUNTANT"],
  },
};

export function can(
  role: string | undefined,
  area: PermissionArea,
  action: PermissionAction = "read",
): boolean {
  if (!role) return false;

  return permissions[area][action]?.includes(role as UserRole) ?? false;
}

const areaPaths: ReadonlyArray<{
  prefix: string;
  area: PermissionArea;
}> = [
  { prefix: "/dashboard", area: "dashboard" },
  { prefix: "/users", area: "users" },
  { prefix: "/events", area: "events" },
  { prefix: "/customers", area: "customers" },
  { prefix: "/employees", area: "employees" },
  { prefix: "/products", area: "products" },
  { prefix: "/equipment", area: "inventory" },
  { prefix: "/reservations", area: "reservations" },
  { prefix: "/quotes", area: "quotes" },
  { prefix: "/invoices", area: "invoices" },
];

function isPermissionArea(value: string): value is PermissionArea {
  return value in permissions;
}

export function getAreaForPath(
  pathname: string,
): PermissionArea | null {
  const match = areaPaths.find(
    ({ prefix }) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return match?.area ?? null;
}

export function canAccessPath(
  role: string | undefined,
  pathname: string,
): boolean {
  const area = getAreaForPath(pathname);

  // Unbekannte Pfade werden von der 404-Seite behandelt.
  return area === null ? true : can(role, area);
}

export function filterNavigation<T extends { key: string }>(
  items: readonly T[],
  role: string | undefined,
): T[] {
  return items.filter(
    (item) => isPermissionArea(item.key) && can(role, item.key),
  );
}
