import { useTranslation } from "react-i18next";

import { can } from "../../features/auth/permissions";
import { useEvents } from "../../features/events/hooks/useEvents";
import { useCustomers } from "../../features/customers/hooks/useCustomers";
import { useReservations } from "../../features/reservations/hooks/useReservations";
import { useInvoices } from "../../features/invoices/hooks/useInvoices";
import { useAppUser } from "../../features/users/context/AppUserContext";

import { DashboardStats } from "./DashboardStats";

export function DashboardOverview() {
  const { t } = useTranslation();
  const currentUser = useAppUser();
  const role = currentUser?.role;

  const canReadEvents = can(role, "events");
  const canReadCustomers = can(role, "customers");
  const canReadReservations = can(role, "reservations");
  const canReadInvoices = can(role, "invoices");

  // Abfragen nur für Bereiche starten, für die die Rolle Leserechte hat.
  const eventsQuery = useEvents({ enabled: canReadEvents });
  const customersQuery = useCustomers({
    enabled: canReadCustomers,
  });
  const reservationsQuery = useReservations({
    enabled: canReadReservations,
  });
  const invoicesQuery = useInvoices({
    enabled: canReadInvoices,
  });

  const stats = [
    ...(canReadEvents
      ? [
          {
            label: t("navigation.events"),
            value: eventsQuery.events.length,
            isLoading: eventsQuery.isLoading,
            isError: eventsQuery.isError,
          },
        ]
      : []),
    ...(canReadCustomers
      ? [
          {
            label: t("navigation.customers"),
            value: customersQuery.customers.length,
            isLoading: customersQuery.isLoading,
            isError: customersQuery.isError,
          },
        ]
      : []),
    ...(canReadReservations
      ? [
          {
            label: t("navigation.reservations"),
            value: reservationsQuery.data?.length ?? 0,
            isLoading: reservationsQuery.isLoading,
            isError: reservationsQuery.isError,
          },
        ]
      : []),
    ...(canReadInvoices
      ? [
          {
            label: t("navigation.invoices"),
            value: invoicesQuery.invoices.length,
            isLoading: invoicesQuery.isLoading,
            isError: invoicesQuery.isError,
          },
        ]
      : []),
  ];

  if (stats.length === 0) {
    return null;
  }

  return (
    <DashboardStats
      stats={stats}
      ariaLabel={t("dashboard.title")}
    />
  );
}
