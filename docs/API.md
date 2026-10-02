# Nexus Events ERP – API Documentation

## Overview

Nexus Events ERP provides a REST API for managing companies, branches,
departments, employees, customers, events, products, inventory, equipment
reservations, equipment movements, quotes and invoices.

Base URL during local development:

`http://localhost:3000`

All protected endpoints use Clerk authentication and role-based access control
(RBAC).

---

## Authentication

Authenticated requests must include a valid Clerk bearer token.

### Current User

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/me` | Returns the currently authenticated application user |

A new authenticated Clerk user is automatically created in the application
database with the default role `EMPLOYEE`.

---

## Companies

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/companies` | List companies | OWNER, ADMIN, HR_MANAGER, ACCOUNTANT, SALES_MANAGER, PROJECT_MANAGER, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER |
| GET | `/api/companies/:id` | Get company by ID | OWNER, ADMIN, HR_MANAGER, ACCOUNTANT, SALES_MANAGER, PROJECT_MANAGER, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER |
| POST | `/api/companies` | Create company | OWNER, ADMIN |
| PATCH | `/api/companies/:id` | Update company | OWNER, ADMIN |
| PATCH | `/api/companies/:id/deactivate` | Deactivate company | OWNER, ADMIN |

---

## Branches

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/branches` | List branches | OWNER, ADMIN, HR_MANAGER, ACCOUNTANT, SALES_MANAGER, PROJECT_MANAGER, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER |
| GET | `/api/branches/:id` | Get branch by ID | OWNER, ADMIN, HR_MANAGER, ACCOUNTANT, SALES_MANAGER, PROJECT_MANAGER, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER |
| POST | `/api/branches` | Create branch | OWNER, ADMIN |
| PATCH | `/api/branches/:id` | Update branch | OWNER, ADMIN |
| PATCH | `/api/branches/:id/deactivate` | Deactivate branch | OWNER, ADMIN |

---

## Departments

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/departments` | List departments | OWNER, ADMIN, HR_MANAGER, PROJECT_MANAGER, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER |
| GET | `/api/departments/:id` | Get department by ID | OWNER, ADMIN, HR_MANAGER, PROJECT_MANAGER, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER |
| POST | `/api/departments` | Create department | OWNER, ADMIN |
| PATCH | `/api/departments/:id` | Update department | OWNER, ADMIN |
| PATCH | `/api/departments/:id/deactivate` | Deactivate department | OWNER, ADMIN |

---

## Warehouses

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/warehouses` | List warehouses | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, PROJECT_MANAGER, DEPARTMENT_MANAGER, TECHNICIAN |
| GET | `/api/warehouses/:id` | Get warehouse by ID | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, PROJECT_MANAGER, DEPARTMENT_MANAGER, TECHNICIAN |
| POST | `/api/warehouses` | Create warehouse | OWNER, ADMIN, WAREHOUSE_MANAGER |
| PATCH | `/api/warehouses/:id` | Update warehouse | OWNER, ADMIN, WAREHOUSE_MANAGER |
| PATCH | `/api/warehouses/:id/deactivate` | Deactivate warehouse | OWNER, ADMIN, WAREHOUSE_MANAGER |

---

## Employees

All employee endpoints require one of:

`OWNER`, `ADMIN`, `HR_MANAGER`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/employees` | List employees |
| GET | `/api/employees/:id` | Get employee by ID |
| POST | `/api/employees` | Create employee |
| PATCH | `/api/employees/:id` | Update employee |
| PATCH | `/api/employees/:id/deactivate` | Deactivate employee |
| POST | `/api/employees/:employeeId/employment-periods` | Add employment period |
| POST | `/api/employees/:employeeId/documents` | Add employee document |

---

## Customers

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/customers` | List customers | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER |
| GET | `/api/customers/:id` | Get customer by ID | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER |
| POST | `/api/customers` | Create customer | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER |
| PATCH | `/api/customers/:id` | Update customer | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER |
| PATCH | `/api/customers/:id/deactivate` | Deactivate customer | OWNER, ADMIN, SALES_MANAGER |

---

## Events

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/events` | List events | OWNER, ADMIN, PROJECT_MANAGER, SALES_MANAGER, SALES_EMPLOYEE, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER, TECHNICIAN |
| GET | `/api/events/:id` | Get event by ID | OWNER, ADMIN, PROJECT_MANAGER, SALES_MANAGER, SALES_EMPLOYEE, DEPARTMENT_MANAGER, WAREHOUSE_MANAGER, TECHNICIAN |
| POST | `/api/events` | Create event | OWNER, ADMIN, PROJECT_MANAGER, SALES_MANAGER |
| PATCH | `/api/events/:id` | Update event | OWNER, ADMIN, PROJECT_MANAGER |

---

## Products

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/products` | List products | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER, DEPARTMENT_MANAGER, TECHNICIAN |
| GET | `/api/products/:id` | Get product by ID | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER, DEPARTMENT_MANAGER, TECHNICIAN |
| POST | `/api/products` | Create product | OWNER, ADMIN, WAREHOUSE_MANAGER |
| PATCH | `/api/products/:id` | Update product | OWNER, ADMIN, WAREHOUSE_MANAGER |
| PATCH | `/api/products/:id/deactivate` | Deactivate product | OWNER, ADMIN, WAREHOUSE_MANAGER |

---

## Inventory Items

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/inventory-items` | List inventory items | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, PROJECT_MANAGER, DEPARTMENT_MANAGER, TECHNICIAN |
| GET | `/api/inventory-items/:id` | Get inventory item by ID | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, PROJECT_MANAGER, DEPARTMENT_MANAGER, TECHNICIAN |
| POST | `/api/inventory-items` | Create inventory item | OWNER, ADMIN, WAREHOUSE_MANAGER |
| PATCH | `/api/inventory-items/:id` | Update inventory item | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE |

---

## Reservations

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/reservations` | List reservations | OWNER, ADMIN, PROJECT_MANAGER, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, DEPARTMENT_MANAGER, TECHNICIAN |
| GET | `/api/reservations/:id` | Get reservation by ID | OWNER, ADMIN, PROJECT_MANAGER, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, DEPARTMENT_MANAGER, TECHNICIAN |
| POST | `/api/reservations` | Create reservation | OWNER, ADMIN, PROJECT_MANAGER, WAREHOUSE_MANAGER |
| PATCH | `/api/reservations/:id` | Update reservation | OWNER, ADMIN, PROJECT_MANAGER, WAREHOUSE_MANAGER |

Overlapping active reservations for the same inventory item are rejected.
Cancelled reservations do not block equipment availability.

---

## Equipment Movements

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/equipment-movements/:inventoryItemId` | Get movement history | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE, PROJECT_MANAGER, DEPARTMENT_MANAGER, TECHNICIAN |
| POST | `/api/equipment-movements/:inventoryItemId` | Create equipment movement | OWNER, ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_EMPLOYEE |

---

## Quotes

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/quotes` | List quotes | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER, ACCOUNTANT |
| GET | `/api/quotes/:id` | Get quote by ID | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE, PROJECT_MANAGER, ACCOUNTANT |
| POST | `/api/quotes` | Create quote | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE |
| PATCH | `/api/quotes/:id` | Update quote | OWNER, ADMIN, SALES_MANAGER, SALES_EMPLOYEE |

---

## Invoices

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/invoices` | List invoices | OWNER, ADMIN, ACCOUNTANT, SALES_MANAGER, PROJECT_MANAGER |
| GET | `/api/invoices/:id` | Get invoice by ID | OWNER, ADMIN, ACCOUNTANT, SALES_MANAGER, PROJECT_MANAGER |
| POST | `/api/invoices` | Create invoice | OWNER, ADMIN, ACCOUNTANT |
| PATCH | `/api/invoices/:id` | Update invoice | OWNER, ADMIN, ACCOUNTANT |

---

## HTTP Status Codes

Common API responses:

| Status | Meaning |
|---|---|
| 200 | Request successful |
| 201 | Resource created |
| 400 | Validation error / invalid request |
| 401 | Authentication required |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Resource conflict |
| 500 | Internal server error |

---

## Security

The API currently uses:

- Clerk authentication
- Role-based access control (RBAC)
- Zod request validation
- Helmet security headers
- Restricted CORS origins
- API rate limiting
- JSON payload size limits
- Centralized error handling
- PostgreSQL persistence through Prisma
