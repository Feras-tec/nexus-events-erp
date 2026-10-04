import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
} from "@tanstack/react-router";

import { ProtectedDashboardLayout } from "./components/templates/ProtectedDashboardLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { EmployeeDetailPage } from "./pages/EmployeeDetailPage";
import { EquipmentPage } from "./pages/EquipmentPage";
import { EquipmentDetailPage } from "./pages/EquipmentDetailPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { SignInPage } from "./pages/SignInPage";
import { ReservationsPage } from "./pages/ReservationsPage";
import { ReservationDetailPage } from "./pages/ReservationDetailPage";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <Navigate to="/dashboard" replace />,
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-in",
  component: SignInPage,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: () => (
    <ProtectedDashboardLayout>
      <Outlet />
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
