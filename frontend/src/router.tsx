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
import { EquipmentPage } from "./pages/EquipmentPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { SignInPage } from "./pages/SignInPage";

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

const equipmentRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/equipment",
  component: EquipmentPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  signInRoute,
  appRoute.addChildren([
    dashboardRoute,
    eventsRoute,
    eventDetailRoute,
    employeesRoute,
    customersRoute,
    customerDetailRoute,
    equipmentRoute,
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
