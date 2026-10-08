import { useTranslation } from "react-i18next";

import { useEvents } from "../../features/events/hooks/useEvents";
import { useCustomers } from "../../features/customers/hooks/useCustomers";
import { useReservations } from "../../features/reservations/hooks/useReservations";
import { useInvoices } from "../../features/invoices/hooks/useInvoices";

import { DashboardStats } from "./DashboardStats";

export function DashboardOverview() {
  const { t } = useTranslation();

  const eventsQuery = useEvents();
  const customersQuery = useCustomers();
  const reservationsQuery = useReservations();
  const invoicesQuery = useInvoices();

  const stats = [
    {
      label: t("navigation.events"),
      value: eventsQuery.events.length,
      isLoading: eventsQuery.isLoading,
      isError: eventsQuery.isError,
    },
    {
      label: t("navigation.customers"),
      value: customersQuery.customers.length,
      isLoading: customersQuery.isLoading,
      isError: customersQuery.isError,
    },
    {
      label: t("navigation.reservations"),
      value: reservationsQuery.data?.length ?? 0,
      isLoading: reservationsQuery.isLoading,
      isError: reservationsQuery.isError,
    },
    {
      label: t("navigation.invoices"),
      value: invoicesQuery.invoices.length,
      isLoading: invoicesQuery.isLoading,
      isError: invoicesQuery.isError,
    },
  ];

  return (
    <DashboardStats
      stats={stats}
      ariaLabel={t("dashboard.title")}
    />
  );
}
