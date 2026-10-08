import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  CalendarDays,
  UsersRound,
  UserRound,
  Package,
  Boxes,
  CalendarCheck2,
  FileText,
  ReceiptText,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

import { DashboardOverview } from "../components/organisms/DashboardOverview";
import { UpcomingEvents } from "../features/dashboard/components/UpcomingEvents";
import { InvoicesAttention } from "../features/dashboard/components/InvoicesAttention";
import { useEvents } from "../features/events/hooks/useEvents";
import { useInvoices } from "../features/invoices/hooks/useInvoices";

type DashboardSection = {
  key: string;
  to: string;
  icon: LucideIcon;
  descriptionKey?: string;
};

const dashboardSections: DashboardSection[] = [
  {
    key: "events",
    to: "/events",
    icon: CalendarDays,
    descriptionKey: "dashboard.manageEvents",
  },
  {
    key: "customers",
    to: "/customers",
    icon: UsersRound,
    descriptionKey: "dashboard.manageCustomers",
  },
  {
    key: "employees",
    to: "/employees",
    icon: UserRound,
  },
  {
    key: "products",
    to: "/products",
    icon: Package,
  },
  {
    key: "inventory",
    to: "/equipment",
    icon: Boxes,
    descriptionKey: "dashboard.manageInventory",
  },
  {
    key: "reservations",
    to: "/reservations",
    icon: CalendarCheck2,
  },
  {
    key: "quotes",
    to: "/quotes",
    icon: FileText,
  },
  {
    key: "invoices",
    to: "/invoices",
    icon: ReceiptText,
    descriptionKey: "dashboard.manageInvoices",
  },
];

export function DashboardPage() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const { events, isLoading, isError } = useEvents();

  const {
    invoices,
    isLoading: invoicesLoading,
    isError: invoicesError,
  } = useInvoices();

  return (
    <motion.section
      initial={
        reduceMotion ? false : { opacity: 0, y: 10 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="mx-auto max-w-7xl space-y-7"
    >
      <header className="relative overflow-hidden rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-16 -top-20 h-56 w-56 rounded-full bg-primary/5 blur-3xl"
        />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
              Nexus Events ERP
            </p>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t("dashboard.title")}
            </h1>

            <p className="mt-3 text-sm text-base-content/60 sm:text-base">
              {t("dashboard.welcome")}
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-primary sm:h-20 sm:w-20">
            <LayoutDashboard
              size={34}
              strokeWidth={1.6}
              aria-hidden="true"
            />
          </div>
        </div>
      </header>

      <DashboardOverview />

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <UpcomingEvents
          events={events}
          isLoading={isLoading}
          isError={isError}
        />

        <InvoicesAttention
          invoices={invoices}
          isLoading={invoicesLoading}
          isError={invoicesError}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardSections.map((section, index) => {
          const Icon = section.icon;

          return (
            <motion.div
              key={section.key}
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, y: 12 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.3,
                delay: reduceMotion ? 0 : index * 0.035,
              }}
            >
              <Link
                to={section.to}
                className="group flex h-full min-h-40 flex-col justify-between rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-content">
                    <Icon
                      size={23}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </span>

                  <ArrowUpRight
                    size={19}
                    className="text-base-content/40 transition-colors group-hover:text-primary"
                    aria-hidden="true"
                  />
                </div>

                <div className="mt-5">
                  <h2 className="text-base font-bold sm:text-lg">
                    {t(`navigation.${section.key}`)}
                  </h2>

                  {section.descriptionKey && (
                    <p className="mt-1 text-sm text-base-content/60">
                      {t(section.descriptionKey)}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
