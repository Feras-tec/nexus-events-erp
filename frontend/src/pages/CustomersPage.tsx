import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "../components/atoms/Button";
import { CustomerForm } from "../components/organisms/CustomerForm";
import { CustomerTable } from "../components/organisms/CustomerTable";
import { ListLayout } from "../components/templates/ListLayout";
import { useCustomers } from "../features/customers/hooks/useCustomers";
import { CustomerStats } from "../features/customers/components/CustomerStats";
import {
  CustomerFilters,
  type CustomerTypeFilter,
  type CustomerStatusFilter,
} from "../features/customers/components/CustomerFilters";
import { useCreateCustomer } from "../features/customers/hooks/useCreateCustomer";

export function CustomersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<CustomerTypeFilter>("ALL");
  const [statusFilter, setStatusFilter] =
    useState<CustomerStatusFilter>("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    customers,
    isLoading,
    isError,
  } = useCustomers();

  const { createCustomerMutation } = useCreateCustomer({
    onSuccess: () => setShowCreateForm(false),
  });

  const normalizedSearch = search.trim().toLowerCase();

  const filteredCustomers = customers.filter((customer) => {
    if (typeFilter !== "ALL" && customer.type !== typeFilter) {
      return false;
    }

    if (statusFilter === "ACTIVE" && !customer.isActive) {
      return false;
    }

    if (statusFilter === "INACTIVE" && customer.isActive) {
      return false;
    }

    if (!normalizedSearch) return true;

    const searchableText = [
      customer.customerNo,
      customer.type,
      customer.companyName,
      customer.firstName,
      customer.lastName,
      customer.contactName,
      customer.email,
      customer.phone,
      customer.address,
      customer.vatId,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <ListLayout
        title={t("navigation.customers")}
        description={t("customers.description")}
        searchValue={search}
        searchPlaceholder={t("customers.searchPlaceholder")}
        onSearchChange={setSearch}
        actions={
          <Button
            type="button"
            onClick={() =>
              setShowCreateForm((current) => !current)
            }
          >
            {showCreateForm
              ? t("common.cancel")
              : t("customers.newCustomer")}
          </Button>
        }
      >
        {!isLoading && !isError && (
          <div className="mb-6">
            <CustomerStats customers={customers} />
          </div>
        )}

        <div className="mb-6">
          <CustomerFilters
            type={typeFilter}
            status={statusFilter}
            onTypeChange={setTypeFilter}
            onStatusChange={setStatusFilter}
            onReset={() => {
              setSearch("");
              setTypeFilter("ALL");
              setStatusFilter("ALL");
            }}
          />
        </div>

        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              <CustomerForm
                loading={createCustomerMutation.isPending}
                onSubmit={(data) =>
                  createCustomerMutation.mutate(data)
                }
              />

              {createCustomerMutation.isError && (
                <div
                  role="alert"
                  className="alert alert-error mt-4"
                >
                  {t("customers.createError")}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-center py-12">
            <span
              className="loading loading-spinner loading-lg"
              aria-label={t("customers.loading")}
            />
          </div>
        )}

        {isError && (
          <div role="alert" className="alert alert-error">
            {t("customers.loadError")}
          </div>
        )}

        {!isLoading && !isError && (
          <CustomerTable
            customers={filteredCustomers}
            onView={(customer) => {
              navigate({
                to: "/customers/$customerId",
                params: {
                  customerId: customer.id,
                },
              });
            }}
          />
        )}
      </ListLayout>
    </motion.div>
  );
}
