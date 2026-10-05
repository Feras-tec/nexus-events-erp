import { motion } from "motion/react";

import type { EventDetail } from "../types/event.types";
import { getCustomerName } from "../utils/event-formatters";

type EventCustomerCardProps = {
  customer: EventDetail["customer"];
};

export function EventCustomerCard({
  customer,
}: EventCustomerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: 0.05 }}
      className="rounded-box border border-base-300 bg-base-100 p-6"
    >
      <h2 className="mb-4 text-lg font-semibold">
        Kunde
      </h2>

      <div className="space-y-3">
        <div>
          <div className="text-sm text-base-content/60">
            Name
          </div>
          <div className="font-medium">
            {getCustomerName(customer)}
          </div>
        </div>

        <div>
          <div className="text-sm text-base-content/60">
            Kundennr.
          </div>
          <div>{customer.customerNo}</div>
        </div>

        <div>
          <div className="text-sm text-base-content/60">
            E-Mail
          </div>
          <div>{customer.email || "—"}</div>
        </div>

        <div>
          <div className="text-sm text-base-content/60">
            Telefon
          </div>
          <div>{customer.phone || "—"}</div>
        </div>
      </div>
    </motion.div>
  );
}
