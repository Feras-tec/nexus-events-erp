import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

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
  const [search, setSearch] = useState("");

  const {
    data: customers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        "/api/customers",
        token,
      );

      const result =
        (await response.json()) as CustomersResponse;

      return result.data;
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
    <ListLayout
      title="Customers"
      description="Kunden und Kontaktdaten verwalten."
      searchValue={search}
      searchPlaceholder="Kunden suchen..."
      onSearchChange={setSearch}
    >
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
        <CustomerTable customers={filteredCustomers} />
      )}
    </ListLayout>
  );
}
