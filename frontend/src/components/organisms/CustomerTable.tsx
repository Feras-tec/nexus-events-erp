import { StatusChip } from "../atoms/StatusChip";

export type Customer = {
  id: string;
  customerNo: string;
  type: string;
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

type CustomerTableProps = {
  customers: Customer[];
  onView?: (customer: Customer) => void;
};

function getCustomerName(customer: Customer) {
  if (customer.companyName) {
    return customer.companyName;
  }

  const fullName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ");

  return fullName || "—";
}

export function CustomerTable({
  customers,
  onView,
}: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="rounded-box border border-base-300 bg-base-100 p-8 text-center">
        <p className="text-base-content/70">
          Keine Kunden gefunden.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table className="table">
        <thead>
          <tr>
            <th>Kunde</th>
            <th>Kundennr.</th>
            <th>Typ</th>
            <th>Kontakt</th>
            <th>Rabatt</th>
            <th>Status</th>
            {onView && <th />}
          </tr>
        </thead>

        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>
                <div className="font-medium">
                  {getCustomerName(customer)}
                </div>

                {customer.contactName && (
                  <div className="text-sm text-base-content/60">
                    {customer.contactName}
                  </div>
                )}
              </td>

              <td>{customer.customerNo}</td>

              <td>{customer.type}</td>

              <td>
                <div>{customer.email || "—"}</div>
                <div className="text-sm text-base-content/60">
                  {customer.phone || "—"}
                </div>
              </td>

              <td>{customer.discount}%</td>

              <td>
                <StatusChip
                  status={customer.isActive ? "ACTIVE" : "INACTIVE"}
                />
              </td>

              {onView && (
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onView(customer)}
                  >
                    Anzeigen
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
