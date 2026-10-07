import { useTranslation } from "react-i18next";

import { StatusChip } from "../../../components/atoms/StatusChip";
import type { CustomerDetail } from "../types/customer.types";

type CustomerOverviewProps = {
  customer: CustomerDetail;
};

export function CustomerOverview({
  customer,
}: CustomerOverviewProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {t("customers.overview.title")}
        </h2>

        <StatusChip
          status={customer.isActive ? "ACTIVE" : "INACTIVE"}
        />
      </div>

      <dl className="grid gap-6 md:grid-cols-2">
        <div>
          <dt className="text-sm text-base-content/60">
            {t("customers.form.customerNo")}
          </dt>
          <dd className="mt-1 font-medium">
            {customer.customerNo}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">
            {t("customers.form.type")}
          </dt>
          <dd className="mt-1 font-medium">
            {t(`customers.types.${customer.type}`, {
              defaultValue: customer.type,
            })}
          </dd>
        </div>

        {customer.companyName && (
          <div>
            <dt className="text-sm text-base-content/60">
              {t("customers.form.companyName")}
            </dt>
            <dd className="mt-1 font-medium">
              {customer.companyName}
            </dd>
          </div>
        )}

        {customer.firstName && (
          <div>
            <dt className="text-sm text-base-content/60">
              {t("customers.form.firstName")}
            </dt>
            <dd className="mt-1 font-medium">
              {customer.firstName}
            </dd>
          </div>
        )}

        {customer.lastName && (
          <div>
            <dt className="text-sm text-base-content/60">
              {t("customers.form.lastName")}
            </dt>
            <dd className="mt-1 font-medium">
              {customer.lastName}
            </dd>
          </div>
        )}

        <div>
          <dt className="text-sm text-base-content/60">
            {t("customers.form.contactName")}
          </dt>
          <dd className="mt-1 font-medium">
            {customer.contactName || "—"}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">
            {t("customers.form.email")}
          </dt>
          <dd className="mt-1 font-medium">
            {customer.email || "—"}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">
            {t("customers.form.phone")}
          </dt>
          <dd className="mt-1 font-medium">
            {customer.phone || "—"}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">
            {t("customers.form.address")}
          </dt>
          <dd className="mt-1 font-medium">
            {customer.address || "—"}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">
            {t("customers.form.vatId")}
          </dt>
          <dd className="mt-1 font-medium">
            {customer.vatId || "—"}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-base-content/60">
            {t("customers.form.discount")}
          </dt>
          <dd className="mt-1 font-medium">
            {customer.discount}%
          </dd>
        </div>
      </dl>
    </div>
  );
}
