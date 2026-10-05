import { StatusChip } from "../../../components/atoms/StatusChip";
import type { CustomerDetail } from "../types/customer.types";

type CustomerOverviewProps = {
  customer: CustomerDetail;
};

export function CustomerOverview({
  customer,
}: CustomerOverviewProps) {
  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Kundendaten</h2>

        <StatusChip
          status={customer.isActive ? "ACTIVE" : "INACTIVE"}
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
    </div>
  );
}
