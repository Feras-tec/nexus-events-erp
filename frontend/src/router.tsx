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
import { EmployeesPage } from "./pages/EmployeesPage";

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

const employeesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/employees",
  component: EmployeesPage,
});

const routeTree = rootRoute.addChildren([
  appRoute.addChildren([dashboardRoute, eventsRoute, employeesRoute]),
]);

export const router = createRouter({
  routeTree,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
