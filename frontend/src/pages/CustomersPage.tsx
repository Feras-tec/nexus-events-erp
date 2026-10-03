import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "../components/atoms/Button";
import {
  CustomerForm,
  type CustomerFormData,
} from "../components/organisms/CustomerForm";
import {
  CustomerTable,
  type Customer,
} from "../components/organisms/CustomerTable";
import { ListLayout } from "../components/templates/ListLayout";
import { apiFetch } from "../services/api";

type CustomersResponse = {
  data: Customer[];
};

export function CustomersPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    data: customers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/customers", token);

      const result = (await response.json()) as CustomersResponse;

      return result.data;
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const token = await getToken();

      const payload = {
        customerNo: data.customerNo.trim(),
        type: data.type,

        companyName:
          data.type === "COMPANY" ? data.companyName.trim() : undefined,

        firstName: data.type === "PRIVATE" ? data.firstName.trim() : undefined,

        lastName: data.type === "PRIVATE" ? data.lastName.trim() : undefined,

        contactName: data.contactName.trim() || undefined,
        email: data.email.trim() || undefined,
        phone: data.phone.trim() || undefined,
        address: data.address.trim() || undefined,
        vatId: data.vatId.trim() || undefined,
        discount: Number(data.discount),
      };

      const response = await apiFetch("/api/customers", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return response.json();
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["customers"],
      });

      setShowCreateForm(false);
    },
  });

  const normalizedSearch = search.trim().toLowerCase();

  const filteredCustomers = customers.filter((customer) => {
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
        title="Customers"
        description="Kunden und Kontaktdaten verwalten."
        searchValue={search}
        searchPlaceholder="Kunden suchen..."
        onSearchChange={setSearch}
        actions={
          <Button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
          >
            {showCreateForm ? "Abbrechen" : "Neuer Kunde"}
          </Button>
        }
      >
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
                onSubmit={(data) => createCustomerMutation.mutate(data)}
              />

              {createCustomerMutation.isError && (
                <div role="alert" className="alert alert-error mt-4">
                  Kunde konnte nicht erstellt werden.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-center py-12">
            <span
              className="loading loading-spinner loading-lg"
              aria-label="Kunden werden geladen"
            />
          </div>
        )}

        {isError && (
          <div role="alert" className="alert alert-error">
            Kunden konnten nicht geladen werden.
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
