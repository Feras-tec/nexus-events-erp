import { lazy, Suspense } from "react";

import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
} from "@tanstack/react-router";

import { ProtectedDashboardLayout } from "./components/templates/ProtectedDashboardLayout";
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));
const EventsPage = lazy(() => import("./pages/EventsPage").then((module) => ({ default: module.EventsPage })));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage").then((module) => ({ default: module.EventDetailPage })));
const EmployeesPage = lazy(() => import("./pages/EmployeesPage").then((module) => ({ default: module.EmployeesPage })));
const EmployeeDetailPage = lazy(() => import("./pages/EmployeeDetailPage").then((module) => ({ default: module.EmployeeDetailPage })));
const EquipmentPage = lazy(() => import("./pages/EquipmentPage").then((module) => ({ default: module.EquipmentPage })));
const EquipmentDetailPage = lazy(() => import("./pages/EquipmentDetailPage").then((module) => ({ default: module.EquipmentDetailPage })));
const ProductsPage = lazy(() => import("./pages/ProductsPage").then((module) => ({ default: module.ProductsPage })));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage").then((module) => ({ default: module.ProductDetailPage })));
const CustomersPage = lazy(() => import("./pages/CustomersPage").then((module) => ({ default: module.CustomersPage })));
const CustomerDetailPage = lazy(() => import("./pages/CustomerDetailPage").then((module) => ({ default: module.CustomerDetailPage })));
const SignInPage = lazy(() => import("./pages/SignInPage").then((module) => ({ default: module.SignInPage })));
const ReservationsPage = lazy(() => import("./pages/ReservationsPage").then((module) => ({ default: module.ReservationsPage })));
const ReservationDetailPage = lazy(() => import("./pages/ReservationDetailPage").then((module) => ({ default: module.ReservationDetailPage })));
const QuotesPage = lazy(() => import("./pages/QuotesPage").then((module) => ({ default: module.QuotesPage })));
const QuoteDetailPage = lazy(() => import("./pages/QuoteDetailPage").then((module) => ({ default: module.QuoteDetailPage })));
const InvoicesPage = lazy(() => import("./pages/InvoicesPage").then((module) => ({ default: module.InvoicesPage })));
const InvoiceDetailPage = lazy(() => import("./pages/InvoiceDetailPage").then((module) => ({ default: module.InvoiceDetailPage })));

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <Suspense fallback={null}>
      <NotFoundPage />
    </Suspense>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <Navigate to="/dashboard" replace />,
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-in",
  component: () => (
    <Suspense fallback={null}>
      <SignInPage />
    </Suspense>
  ),
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: () => (
    <ProtectedDashboardLayout>
      <Suspense
        fallback={
          <div
            className="flex min-h-64 items-center justify-center"
            role="status"
            aria-label="Loading page"
          >
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </ProtectedDashboardLayout>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const eventsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/events",
  component: EventsPage,
});

const eventDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/events/$eventId",
  component: EventDetailPage,
});

const employeesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/employees",
  component: EmployeesPage,
});

const employeeDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/employees/$employeeId",
  component: EmployeeDetailPage,
});

const customersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/customers",
  component: CustomersPage,
});

const customerDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/customers/$customerId",
  component: CustomerDetailPage,
});

const productsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/products",
  component: ProductsPage,
});

const productDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/products/$productId",
  component: ProductDetailPage,
});

const equipmentRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/equipment",
  component: EquipmentPage,
});

const equipmentDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/equipment/$equipmentId",
  component: EquipmentDetailPage,
});

const reservationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/reservations",
  component: ReservationsPage,
});

const reservationDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/reservations/$reservationId",
  component: ReservationDetailPage,
});

const quotesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/quotes",
  component: QuotesPage,
});

const quoteDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/quotes/$quoteId",
  component: QuoteDetailPage,
});

const invoicesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/invoices",
  component: InvoicesPage,
});

const invoiceDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/invoices/$invoiceId",
  component: InvoiceDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  signInRoute,
  appRoute.addChildren([
    dashboardRoute,
    eventsRoute,
    eventDetailRoute,
    employeesRoute,
    employeeDetailRoute,
    customersRoute,
    customerDetailRoute,
    productsRoute,
    productDetailRoute,
    equipmentRoute,
    equipmentDetailRoute,
    reservationsRoute,
    reservationDetailRoute,
    quotesRoute,
    quoteDetailRoute,
    invoicesRoute,
    invoiceDetailRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
