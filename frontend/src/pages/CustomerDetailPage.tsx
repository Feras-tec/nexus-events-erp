import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import { ConfirmDeleteDialog } from "../components/molecules/ConfirmDeleteDialog";
import {
  CustomerForm,
  type CustomerFormData,
} from "../components/organisms/CustomerForm";
import { DetailLayout } from "../components/templates/DetailLayout";
import { CustomerOverview } from "../features/customers/components/CustomerOverview";
import { useCustomerDetail } from "../features/customers/hooks/useCustomerDetail";
import { useUpdateCustomer } from "../features/customers/hooks/useUpdateCustomer";
import { useDeactivateCustomer } from "../features/customers/hooks/useDeactivateCustomer";
import { useActivateCustomer } from "../features/customers/hooks/useActivateCustomer";
import { getCustomerName } from "../features/customers/utils/customer-formatters";

export function CustomerDetailPage() {
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
  } = useCustomerDetail(customerId);

  const { updateCustomerMutation } = useUpdateCustomer({
    customerId,
    onSuccess: () => {
      setIsEditing(false);
    },
  });

  const { deactivateCustomerMutation } = useDeactivateCustomer({
    customerId,
    onSuccess: () => {
      setShowDeactivateDialog(false);
    },
  });

  const { activateCustomerMutation } = useActivateCustomer({
    customerId,
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
            >
              <CustomerOverview customer={customer} />

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
