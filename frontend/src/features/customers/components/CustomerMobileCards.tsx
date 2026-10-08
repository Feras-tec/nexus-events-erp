import { useTranslation } from "react-i18next";
import { Building2, Mail, Phone, Eye } from "lucide-react";
import { StatusChip } from "../../../components/atoms/StatusChip";
import type { Customer } from "../../../components/organisms/CustomerTable";

type Props = {
  customers: Customer[];
  onView?: (customer: Customer) => void;
};

export function CustomerMobileCards({ customers, onView }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 md:hidden">
      {customers.map((customer) => {
        const name =
          customer.companyName ||
          [customer.firstName, customer.lastName]
            .filter(Boolean)
            .join(" ") ||
          "—";

        return (
          <article
            key={customer.id}
            className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="break-words font-semibold">{name}</h3>
                <p className="mt-1 text-xs text-base-content/60">
                  {customer.customerNo}
                </p>
              </div>

              <StatusChip
                status={customer.isActive ? "ACTIVE" : "INACTIVE"}
              />
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="shrink-0 text-base-content/50" />
                <span>
                  {t(`customers.types.${customer.type}`, {
                    defaultValue: customer.type,
                  })}
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Mail size={16} className="mt-0.5 shrink-0 text-base-content/50" />
                <span className="break-all">{customer.email || "—"}</span>
              </div>

              <div className="flex items-center gap-2">
                <Phone size={16} className="shrink-0 text-base-content/50" />
                <span>{customer.phone || "—"}</span>
              </div>
            </div>

            {onView && (
              <button
                type="button"
                className="btn btn-outline btn-primary mt-4 w-full gap-2"
                onClick={() => onView(customer)}
              >
                <Eye size={16} />
                {t("common.view")}
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
