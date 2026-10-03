import { useState } from "react";
import { useAuth } from "@clerk/react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import { StatusChip } from "../components/atoms/StatusChip";
import { ConfirmDeleteDialog } from "../components/molecules/ConfirmDeleteDialog";
import {
  CustomerForm,
  type CustomerFormData,
} from "../components/organisms/CustomerForm";
import { DetailLayout } from "../components/templates/DetailLayout";
import { apiFetch } from "../services/api";

type CustomerDetail = {
  id: string;
  customerNo: string;
  type: "COMPANY" | "PRIVATE";
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  vatId?: string | null;
  discount: number | string;
  isActive: boolean;
};

type CustomerResponse = {
  data: CustomerDetail;
};

function getCustomerName(customer: CustomerDetail) {
  if (customer.companyName) {
    return customer.companyName;
  }

  const fullName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ");

  return fullName || "—";
}

export function CustomerDetailPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] =
    useState(false);

  const { customerId } = useParams({
    from: "/app/customers/$customerId",
  });

  const {
    data: customer,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["customers", customerId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/customers/${customerId}`,
        token,
      );

      const result =
        (await response.json()) as CustomerResponse;

      return result.data;
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const token = await getToken();

      const payload = {
        type: data.type,

        companyName:
          data.type === "COMPANY"
            ? data.companyName.trim() || undefined
            : undefined,

        firstName:
          data.type === "PRIVATE"
            ? data.firstName.trim() || undefined
            : undefined,

        lastName:
          data.type === "PRIVATE"
            ? data.lastName.trim() || undefined
            : undefined,

        contactName: data.contactName.trim() || undefined,
        email: data.email.trim() || undefined,
        phone: data.phone.trim() || undefined,
        address: data.address.trim() || undefined,
        vatId: data.vatId.trim() || undefined,
        discount: Number(data.discount),
      };

      const response = await apiFetch(
        `/api/customers/${customerId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["customers", customerId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["customers"],
        }),
      ]);

      setIsEditing(false);
    },
  });

  const deactivateCustomerMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/customers/${customerId}/deactivate`,
        token,
        {
          method: "PATCH",
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["customers", customerId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["customers"],
        }),
      ]);

      setShowDeactivateDialog(false);
    },
  });

  const activateCustomerMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/customers/${customerId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({
            isActive: true,
          }),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["customers", customerId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["customers"],
        }),
      ]);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span
          className="loading loading-spinner loading-lg"
          aria-label="Kunde wird geladen"
        />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div role="alert" className="alert alert-error">
        Kunde konnte nicht geladen werden.
      </div>
    );
  }

  const initialValues: CustomerFormData = {
    customerNo: customer.customerNo,
    type: customer.type,
    companyName: customer.companyName || "",
    firstName: customer.firstName || "",
    lastName: customer.lastName || "",
    contactName: customer.contactName || "",
    email: customer.email || "",
    phone: customer.phone || "",
    address: customer.address || "",
    vatId: customer.vatId || "",
    discount: String(customer.discount),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <DetailLayout
        title={getCustomerName(customer)}
        description={customer.customerNo}
        actions={
          <>
            <Button
              type="button"
              className="btn-outline"
              onClick={() =>
                navigate({ to: "/customers" })
              }
            >
              ← Zurück
            </Button>

            <Button
              type="button"
              onClick={() =>
                setIsEditing((current) => !current)
              }
            >
              {isEditing ? "Abbrechen" : "Bearbeiten"}
            </Button>

            {customer.isActive && !isEditing && (
              <Button
                type="button"
                variant="error"
                onClick={() =>
                  setShowDeactivateDialog(true)
                }
              >
                Deaktivieren
              </Button>
            )}

            {!customer.isActive && !isEditing && (
              <Button
                type="button"
                onClick={() =>
                  activateCustomerMutation.mutate()
                }
                disabled={activateCustomerMutation.isPending}
              >
                {activateCustomerMutation.isPending
                  ? "Wird aktiviert..."
                  : "Aktivieren"}
              </Button>
            )}
          </>
        }
      >
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <CustomerForm
                mode="edit"
                initialValues={initialValues}
                loading={updateCustomerMutation.isPending}
                onSubmit={(data) =>
                  updateCustomerMutation.mutate(data)
                }
              />

              {updateCustomerMutation.isError && (
                <div
                  role="alert"
                  className="alert alert-error mt-4"
                >
                  Kunde konnte nicht aktualisiert werden.
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="rounded-box border border-base-300 bg-base-100 p-6"
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">
                  Kundendaten
                </h2>

                <StatusChip
                  status={
                    customer.isActive
                      ? "ACTIVE"
                      : "INACTIVE"
                  }
                />
              </div>

              <dl className="grid gap-6 md:grid-cols-2">
                <div>
                  <dt className="text-sm text-base-content/60">
                    Kundennr.
                  </dt>
                  <dd className="mt-1 font-medium">
                    {customer.customerNo}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-base-content/60">
                    Kundentyp
                  </dt>
                  <dd className="mt-1 font-medium">
                    {customer.type === "COMPANY"
                      ? "Unternehmen"
                      : "Privatkunde"}
                  </dd>
                </div>

                {customer.companyName && (
                  <div>
                    <dt className="text-sm text-base-content/60">
                      Firmenname
                    </dt>
                    <dd className="mt-1 font-medium">
                      {customer.companyName}
                    </dd>
                  </div>
                )}

                {customer.firstName && (
                  <div>
                    <dt className="text-sm text-base-content/60">
                      Vorname
                    </dt>
                    <dd className="mt-1 font-medium">
                      {customer.firstName}
                    </dd>
                  </div>
                )}

                {customer.lastName && (
                  <div>
                    <dt className="text-sm text-base-content/60">
                      Nachname
                    </dt>
                    <dd className="mt-1 font-medium">
                      {customer.lastName}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm text-base-content/60">
                    Ansprechpartner
                  </dt>
                  <dd className="mt-1 font-medium">
                    {customer.contactName || "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-base-content/60">
                    E-Mail
                  </dt>
                  <dd className="mt-1 font-medium">
                    {customer.email || "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-base-content/60">
                    Telefon
                  </dt>
                  <dd className="mt-1 font-medium">
                    {customer.phone || "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-base-content/60">
                    Adresse
                  </dt>
                  <dd className="mt-1 font-medium">
                    {customer.address || "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-base-content/60">
                    USt-IdNr.
                  </dt>
                  <dd className="mt-1 font-medium">
                    {customer.vatId || "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-base-content/60">
                    Rabatt
                  </dt>
                  <dd className="mt-1 font-medium">
                    {customer.discount}%
                  </dd>
                </div>
              </dl>

              {deactivateCustomerMutation.isError && (
                <div
                  role="alert"
                  className="alert alert-error mt-6"
                >
                  Kunde konnte nicht deaktiviert werden.
                </div>
              )}

              {activateCustomerMutation.isError && (
                <div
                  role="alert"
                  className="alert alert-error mt-6"
                >
                  Kunde konnte nicht aktiviert werden.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DetailLayout>

      <ConfirmDeleteDialog
        open={showDeactivateDialog}
        title="Kunde deaktivieren"
        message={`Möchten Sie ${getCustomerName(
          customer,
        )} wirklich deaktivieren? Der Kunde wird nicht gelöscht.`}
        confirmLabel="Deaktivieren"
        cancelLabel="Abbrechen"
        loading={deactivateCustomerMutation.isPending}
        onConfirm={() =>
          deactivateCustomerMutation.mutate()
        }
        onCancel={() => {
          if (!deactivateCustomerMutation.isPending) {
            setShowDeactivateDialog(false);
          }
        }}
      />
    </motion.div>
  );
}
