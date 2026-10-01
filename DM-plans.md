# Nexus Events ERP --- DM Plans

> **Master Project Plan**\
> Full-Stack Event Production, Equipment Rental & Business Management
> System\
> This Markdown file is the living source of truth for the project and
> can be edited continuously as requirements evolve.

------------------------------------------------------------------------

## 1. Project Vision

**Nexus Events ERP** is a full-stack management system for a
multi-branch event-production and AV-equipment rental company.

The system manages the complete workflow:

**Customer Request → Quote → Event Planning → Crew & Equipment →
Warehouse → Event → Return & Inspection → Invoice → Payment → Costs &
Profit**

The architecture is designed so that modules and records can be
**created, viewed, edited and deleted/deactivated where business rules
permit**.

------------------------------------------------------------------------

## 2. Global CRUD Requirement

The system should provide appropriate management actions throughout the
application:

-   **Create / Add** new records.
-   **Read / View** lists and detailed records.
-   **Update / Edit** existing records.
-   **Delete** records when safe and permitted.
-   **Deactivate / Archive** instead of deleting records that must
    retain business history.
-   Confirmation dialogs before destructive actions.
-   Role-based permissions determine who may add, edit, delete, archive
    or restore data.
-   Important changes are recorded in the Audit Log.

### Important deletion rule

Not every record should be physically deleted.

Examples:

-   Employee leaves company → **INACTIVE**, not deleted.
-   Equipment retired → **RETIRED/INACTIVE**, history retained.
-   Customer with invoices → archive/deactivate instead of deleting
    history.
-   Issued invoice → do not silently delete; cancel/credit according to
    business workflow.
-   Draft records with no dependent history may be deletable when
    authorized.

------------------------------------------------------------------------

## 3. Company Structure

### Company

-   Company profile and legal information
-   Tax/VAT identifiers
-   Contact details
-   Address
-   Status

### Branches

-   Multiple branches
-   Stable branch code
-   Address and contact information
-   Branch status

### Departments

Planned departments:

-   Camera
-   Audio
-   Video & Screens
-   Lighting & Laser
-   Stage
-   Carpentry / Workshop
-   Interpretation / Translation Booths
-   Electronics
-   Rental
-   Warehouse
-   Transport / Logistics
-   Sales
-   Human Resources
-   Accounting

Each department has a manager, employees and optionally associated
equipment.

Department assignments keep history when employees move between
departments.

------------------------------------------------------------------------

## 4. Employees & HR

Every employee receives a stable ID such as `EMP-000184`.

### Employee Data

-   Full name
-   Date of birth
-   Calculated age
-   Nationality
-   Phone
-   Email
-   Address
-   Branch
-   Department
-   Position
-   Employment status
-   Employment periods
-   Skills and qualifications
-   Tax identifier
-   QR / Barcode

### Documents

Generic `EmployeeDocument` records:

-   PASSPORT
-   RESIDENCE_PERMIT
-   WORK_PERMIT
-   CONTRACT
-   OTHER

Fields can include:

-   Document number
-   Issue date
-   Expiry date
-   Status

The system should support expiry alerts.

### Employment Lifecycle

Statuses may include:

-   ACTIVE
-   INACTIVE
-   ON_LEAVE
-   SUSPENDED

Employees are **not deleted when they leave**. Their employment period
is closed and their login can be disabled.

If rehired, the same Employee ID is reused and a new employment period
is created.

### HR History

Planned support for:

-   Salary history
-   Bonuses
-   Incentives
-   Deductions
-   Vacation entitlement
-   Used / remaining leave
-   Vacation allowance
-   Leave history
-   Working hours
-   Overtime
-   Expenses
-   Tasks
-   Event assignments

Sensitive HR information is protected by backend authorization.

------------------------------------------------------------------------

## 5. Working Time, Tasks & Expenses

### Time Entries

-   Start
-   End
-   Break
-   Regular hours
-   Overtime
-   Event
-   Task

### Tasks

Tasks can be linked to:

-   Event
-   Department
-   Employee

Possible statuses:

-   TODO
-   IN_PROGRESS
-   DONE
-   CANCELLED

### Expenses

Types:

-   MEAL
-   TRANSPORT
-   HOTEL
-   PARKING
-   TAXI
-   OTHER

Approval states:

-   PENDING
-   APPROVED
-   REJECTED

------------------------------------------------------------------------

## 6. Customers / CRM

Support both private and business customers.

Customer information:

-   Stable Customer ID
-   Person / company name
-   Contact person
-   Phone
-   Email
-   Address
-   VAT ID
-   Customer type
-   Customer since
-   Discount %
-   Event history
-   Quote history
-   Invoice history
-   Payment history
-   Return history
-   Total services / purchases
-   Total discounts
-   Outstanding balance

Users with permission can add and edit customers. Historical customers
with transactions should normally be archived rather than hard-deleted.

------------------------------------------------------------------------

## 7. Event / Project Management

The Event is the operational center of the system.

Example ID:

`EV-2026-000184`

### Event Lifecycle

`INQUIRY → QUOTED → CONFIRMED → PREPARING → IN_PROGRESS → COMPLETED → INVOICED → CLOSED`

### Event Data

-   Customer
-   Event type
-   Location
-   Start / end
-   Project manager
-   Departments
-   Crew
-   Tasks
-   Equipment
-   Transport
-   Quote
-   Invoice
-   Expenses
-   Costs
-   Profit

### Department Requirements

Examples:

-   Camera requirements
-   Audio requirements
-   Video requirements
-   Lighting requirements
-   Stage requirements
-   Interpretation requirements

Departments can have approval/preparation statuses.

------------------------------------------------------------------------

## 8. Products & Inventory

### Product

Represents a product/model/category.

Examples:

-   Sony FX6
-   Shure ULXD2
-   LED Processor

### Tracking Types

#### SERIALIZED

Every physical unit receives its own internal ID.

Example:

`EQ-000184`

#### QUANTITY / BULK

Stock is managed by quantity.

Examples:

-   Tape
-   Batteries
-   Cable ties
-   Consumables

### Inventory Item

Possible information:

-   Internal asset ID
-   Manufacturer serial
-   Product
-   Department
-   Warehouse
-   Shelf / location
-   Current status
-   QR / Barcode
-   Purchase information
-   Warranty
-   Movement history
-   Maintenance history

------------------------------------------------------------------------

## 9. Warehouse & Equipment Movement

Possible equipment states:

-   AVAILABLE
-   RESERVED
-   PICKING
-   PACKED
-   IN_TRANSIT
-   AT_EVENT
-   RETURNING
-   INSPECTION
-   DAMAGED
-   MAINTENANCE
-   LOST
-   RETIRED

Warehouse workflow:

`CONFIRMED EVENT → PICK LIST → SCAN → PACKED → LOADED → EVENT → RETURN → INSPECTION → AVAILABLE`

For equipment outside the warehouse, the system should know:

-   Current location
-   Event
-   Customer
-   Checked-out time
-   Expected return
-   Employee responsible

All important movements are stored in `EquipmentMovement`.

------------------------------------------------------------------------

## 10. Availability & Double-Booking Prevention

Availability is date/time based.

The backend must prevent the same serialized equipment from being
assigned to overlapping events/rentals.

For quantity stock:

**Available = Owned − Maintenance − Other Reservations − Other
Unavailable Stock**

If there is a shortage:

1.  Search another internal branch/warehouse.
2.  Create an internal transfer.
3.  If still unavailable, create an external subrental from a supplier.

------------------------------------------------------------------------

## 11. Rental Pricing

Products can support:

-   HOURLY
-   DAILY
-   WEEKLY
-   MONTHLY
-   CUSTOM

A `ProductRate` stores the rate type and amount.

A rental/reservation stores a snapshot of the selected rate so later
price changes do not alter historical transactions.

Exact duration rounding rules will be defined as business rules before
implementation.

------------------------------------------------------------------------

## 12. Packages / Kits

Reusable equipment packages can simplify event planning.

Example:

### Conference Audio Package

-   8 microphones
-   4 speakers
-   Mixer
-   Monitors
-   Cables
-   Optional crew requirements

------------------------------------------------------------------------

## 13. Internal Transfers & Suppliers

### Internal Transfer

Move equipment between branches/warehouses while retaining movement
history.

### Suppliers / External Subrentals

Supplier module can include:

-   Supplier details
-   External rental order
-   Equipment
-   Quantity
-   Rental dates
-   Cost
-   Return
-   Supplier invoice reference

External rental costs feed into event profitability.

------------------------------------------------------------------------

## 14. Returns, Damage & Maintenance

### Rental Return

`RETURNED → INSPECTION → AVAILABLE`

or:

`RETURNED → DAMAGED → MAINTENANCE → REPAIRED → AVAILABLE`

### Damage Report

-   Event
-   Equipment
-   Reporter
-   Problem
-   Repair cost
-   Status

### Sales Return

The backend should:

-   Validate the original invoice.
-   Validate that the item/quantity was actually sold.
-   Prevent over-return.
-   Create Return / ReturnItem records.
-   Calculate refund/credit.
-   Restore eligible inventory when appropriate.
-   Keep transaction history.

------------------------------------------------------------------------

## 15. Quotes, Invoices & Payments

Commercial workflow:

`Customer Request → Quote → Approval → Event → Invoice → Payment`

### Quote

Can contain:

-   Equipment
-   Services
-   Employees / labor
-   Transport
-   Discounts
-   Tax
-   Revisions

### Invoice

Example number:

`INV-2026-HH-000184`

Possible fields:

-   Customer
-   Branch
-   Event
-   Date
-   Line items
-   Quantity
-   Unit price
-   Subtotal
-   Discount
-   VAT / Tax
-   Total
-   Payment status
-   Returns / Credit Notes
-   QR / Barcode

Possible statuses:

-   DRAFT
-   ISSUED
-   PAID
-   OVERDUE
-   CANCELLED

------------------------------------------------------------------------

## 16. Event Costs & Profit

Event financial analysis can include:

-   Revenue
-   Equipment/internal cost
-   External rentals
-   Employee cost
-   Overtime
-   Meals
-   Hotel
-   Transport
-   Other expenses

Then calculate:

-   Total cost
-   Profit
-   Profit margin

------------------------------------------------------------------------

## 17. Roles & Authorization

Planned roles:

-   OWNER
-   ADMIN
-   HR_MANAGER
-   ACCOUNTANT
-   SALES_MANAGER
-   PROJECT_MANAGER
-   DEPARTMENT_MANAGER
-   WAREHOUSE_MANAGER
-   TECHNICIAN
-   WAREHOUSE_EMPLOYEE
-   SALES_EMPLOYEE
-   EMPLOYEE

The **backend** enforces authorization.

Permissions can separately control:

-   View
-   Create
-   Edit
-   Delete
-   Archive
-   Restore
-   Approve
-   Access sensitive fields

------------------------------------------------------------------------

## 18. QR / Barcode

Planned QR/barcode support:

-   Employees
-   Serialized equipment
-   Invoices
-   Events where useful

QR/barcodes should contain an opaque/stable identifier or secure
reference rather than sensitive information.

After scanning, the backend returns only data allowed by the
authenticated user's role.

------------------------------------------------------------------------

## 19. Analytics Dashboard

Possible dashboard information:

-   Revenue
-   Active customers
-   Active employees
-   Branch performance
-   Department costs
-   Event profit
-   Customer revenue
-   Employee costs
-   Equipment utilization
-   Equipment inside/outside warehouse
-   Upcoming shortages
-   Unpaid invoices
-   Expiring employee documents
-   Low stock
-   Maintenance alerts

------------------------------------------------------------------------

# 20. Backend Technology Stack

## Core

-   Node.js
-   Express
-   TypeScript
-   REST API

## Relational Database

-   PostgreSQL
-   Prisma ORM
-   Prisma Migrations

PostgreSQL is the primary source of truth for relational business data.

## NoSQL

-   MongoDB
-   Mongoose

Planned primarily for:

-   Audit Logs
-   Activity History
-   System Events
-   Scan History

## Validation

-   Zod

Validation should cover:

-   Request body
-   URL params
-   Query params

## Authentication

-   Clerk

## Authorization

-   Custom Role-Based Access Control (RBAC)

## Security

-   Helmet
-   CORS
-   Rate Limiting
-   Payload Size Limits
-   Environment Variables
-   Safe Error Handling
-   HTTPS in production

## API Features

-   CRUD
-   Search
-   Filtering
-   Sorting
-   Pagination

## Testing

-   Jest
-   Supertest
-   Unit tests
-   Integration / API tests

## Development & Deployment

-   Git
-   GitHub
-   Neon PostgreSQL
-   MongoDB Atlas
-   Render

------------------------------------------------------------------------

# 21. Backend Architecture

Recommended request flow:

`Route → Authentication → Authorization → Zod Validation → Controller → Service → Data Access → Database`

Suggested structure:

``` text
src/
├── config/
├── routes/
├── controllers/
├── services/
├── middlewares/
├── schemas/
├── repositories/
├── utils/
├── types/
└── tests/
```

MongoDB audit logging remains separated from the primary PostgreSQL
transactional data.

------------------------------------------------------------------------

# 22. Frontend Technology Stack

-   React
-   TypeScript
-   Vite
-   Tailwind CSS
-   DaisyUI
-   TanStack Router
-   TanStack Query
-   Motion
-   Clerk React
-   Atomic Design
-   Responsive Design
-   Internationalization (i18n)
-   RTL support
-   Light / Dark theme
-   Accessibility

------------------------------------------------------------------------

# 23. Three-Language Interface

The complete user interface should support:

-   🇩🇪 **Deutsch**
-   🇬🇧 **English**
-   🇸🇦 **العربية**

### Direction

-   German → LTR
-   English → LTR
-   Arabic → RTL

Language selection should be remembered for the user.

Translation resources should be organized centrally rather than
hardcoding interface text inside components.

Example:

``` text
locales/
├── de/
├── en/
└── ar/
```

Business data entered by users is not automatically translated unless a
future feature explicitly supports that.

------------------------------------------------------------------------

# 24. Light & Dark Mode

The UI supports:

-   Light Mode
-   Dark Mode

Requirements:

-   Manual theme switch.
-   Remember the user's preference.
-   Optionally respect the device/system theme by default.
-   DaisyUI/Tailwind components should remain readable in both modes.
-   Charts, tables, forms and status indicators must remain accessible
    in both modes.

------------------------------------------------------------------------

# 25. Responsive Design

The application should work across:

-   Mobile phones
-   Tablets
-   Laptops
-   Desktop screens
-   Large displays

Responsive behavior examples:

-   Desktop sidebar → mobile drawer/menu.
-   Large tables → responsive table/card strategy.
-   Forms adapt to available width.
-   Touch-friendly controls on mobile.
-   Dashboard cards rearrange by breakpoint.
-   No essential operation should require a desktop screen.

------------------------------------------------------------------------

# 26. Accessibility

Planned frontend quality requirements:

-   Keyboard navigation
-   Proper labels
-   Visible focus states
-   Accessible contrast
-   Semantic HTML
-   Do not communicate status by color alone
-   RTL-compatible layout
-   Responsive text and controls

------------------------------------------------------------------------

# 27. Atomic Design

### Atoms

-   Button
-   Input
-   Select
-   Checkbox
-   Badge
-   Avatar
-   Icon
-   StatusChip
-   ThemeToggle
-   LanguageSwitcher

### Molecules

-   SearchBox
-   EmployeeCard
-   EquipmentCard
-   InvoiceSummary
-   DateRangePicker
-   RentalRateSelector
-   ConfirmDeleteDialog

### Organisms

-   EmployeeTable
-   EquipmentTable
-   EventForm
-   InvoiceForm
-   DashboardStats
-   ResponsiveNavigation
-   EquipmentScanner

### Templates

-   Dashboard layout
-   List layout
-   Detail layout
-   Edit/Create layout

### Pages

-   Dashboard
-   Employees
-   Employee Details
-   Customers
-   Customer Details
-   Events
-   Event Details
-   Departments
-   Equipment
-   Equipment Details
-   Warehouses
-   Rentals
-   Quotes
-   Invoices
-   Invoice Details
-   Suppliers
-   Reports
-   Settings

------------------------------------------------------------------------

# 28. Planned Frontend Routes

``` text
/dashboard

/events
/events/$eventId

/employees
/employees/$employeeId

/customers
/customers/$customerId

/departments

/equipment
/equipment/$equipmentId

/warehouses
/rentals

/quotes

/invoices
/invoices/$invoiceId

/suppliers
/reports
/settings
```

TanStack Router manages navigation.

TanStack Query manages server-state fetching, caching, mutations and
invalidation after create/edit/delete operations.

------------------------------------------------------------------------

# 29. Frontend CRUD UX

For manageable resources, pages should expose actions appropriate to the
user's permission:

-   `+ Add`
-   `View`
-   `Edit`
-   `Delete`
-   `Archive / Deactivate`
-   `Restore` where appropriate

Example:

``` text
Employees
────────────────────────────────────────
[ + Add Employee ]

EMP-001   Anna Müller    Active
          [View] [Edit] [Deactivate]

EMP-002   Max Schmidt    Inactive
          [View] [Edit] [Reactivate]
```

After a mutation:

`React UI → TanStack Query Mutation → REST API → Validation/Auth → Database → Query Invalidation → Updated UI`

Destructive actions require confirmation.

------------------------------------------------------------------------

# 30. Core V1 --- Must Be Complete

The first deliverable should prioritize a coherent, working backend:

-   Clerk authentication
-   RBAC authorization
-   Company
-   Branches
-   Departments
-   Employees
-   Employee documents
-   Employment status/history
-   Customers
-   Events
-   Products
-   Serialized equipment
-   Warehouses
-   Equipment reservations
-   Availability checking
-   Equipment movements
-   Equipment returns
-   Quotes
-   Invoices
-   Zod validation
-   Security
-   Automated tests
-   Documentation
-   ERD
-   Deployment

The architecture should anticipate later modules without requiring every
planned feature to be completed in V1.

------------------------------------------------------------------------

# 31. Expansion Features

After the stable core:

-   Working hours
-   Overtime
-   Tasks
-   Leave
-   Salary history
-   Bonuses / deductions
-   Employee expenses
-   Suppliers
-   External rentals
-   Maintenance
-   Damage reports
-   Payments
-   Sales returns
-   QR / barcode workflows
-   Analytics
-   React frontend
-   PDF invoices
-   Advanced reporting

------------------------------------------------------------------------

# 32. Implementation Roadmap

1.  Freeze requirements and V1 scope.
2.  Create ERD.
3.  Define entities, keys and relationships.
4.  Plan REST endpoints.
5.  Define authorization matrix.
6.  Define request/response/error formats.
7.  Create backend structure.
8.  Configure PostgreSQL + Prisma.
9.  Configure Clerk authentication.
10. Implement RBAC.
11. Build core REST APIs.
12. Implement Zod validation.
13. Implement equipment availability.
14. Implement movement/return logic.
15. Add MongoDB audit logs.
16. Add security middleware.
17. Write Jest + Supertest tests.
18. Complete API documentation.
19. Deploy backend.
20. Create React/Vite frontend.
21. Configure Tailwind + DaisyUI.
22. Configure TanStack Router.
23. Configure TanStack Query.
24. Create Atomic Design component structure.
25. Implement German / English / Arabic i18n and Arabic RTL.
26. Implement Light / Dark theme.
27. Build responsive layouts.
28. Implement CRUD screens and permission-aware actions.
29. Add Motion where it improves UX.
30. Integrate frontend and backend.
31. Perform end-to-end testing.
32. Prepare final submission.

------------------------------------------------------------------------

# 33. Required Project Documentation

The repository should document:

-   Project purpose and users
-   Problem being solved
-   Technology stack and rationale
-   ERD
-   API endpoints
-   HTTP methods
-   Authentication
-   Authorization
-   Request examples
-   Response examples
-   Error examples
-   Installation
-   Environment configuration
-   Database setup
-   Testing
-   Running locally
-   Deployment
-   Live backend URL
-   Security notes

------------------------------------------------------------------------

# 34. Daily Project Updates

## Morning --- 09:00--10:00

Send:

1.  Top three tasks planned for today.
2.  Biggest obstacle/risk.
3.  Mitigation or solution.

## After ILP --- latest 23:59

Send:

1.  At least three completed tasks.
2.  Biggest lesson learned.
3.  Top priority for tomorrow.

------------------------------------------------------------------------

# 35. Immediate Next Step

**Do not start implementation before the data model is agreed.**

Next:

1.  Create the complete ERD.
2.  Separate V1 tables from future tables.
3.  Review relationships and deletion/archive rules.
4.  Convert the approved V1 ERD into `schema.prisma`.
5.  Define API endpoints and permissions.
6.  Start the backend implementation incrementally.

------------------------------------------------------------------------

## Living Plan Rule

This file is intentionally maintained as Markdown so it can stay in the
Git repository and evolve with the project.

When a project decision changes:

-   Edit the relevant section.
-   Add new requirements where they belong.
-   Remove obsolete ideas rather than leaving contradictory plans.
-   Keep V1 and future features clearly separated.
-   Commit meaningful plan changes to Git so the history remains
    visible.
