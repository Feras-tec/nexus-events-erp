import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";

import { DashboardLayout } from "./components/templates/DashboardLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { EquipmentPage } from "./pages/EquipmentPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: () => (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
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
