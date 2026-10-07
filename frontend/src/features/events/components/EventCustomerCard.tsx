import { useTranslation } from "react-i18next";
import { motion } from "motion/react";

import type { EventDetail } from "../types/event.types";
import { getCustomerName } from "../utils/event-formatters";

type EventCustomerCardProps = {
  customer: EventDetail["customer"];
};

export function EventCustomerCard({
  customer,
}: EventCustomerCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: 0.05 }}
      className="rounded-box border border-base-300 bg-base-100 p-6"
    >
      <h2 className="mb-4 text-lg font-semibold">
        {t("events.customerCard.title")}
      </h2>

      <div className="space-y-3">
        <div>
          <div className="text-sm text-base-content/60">
            {t("events.customerCard.name")}
          </div>
          <div className="font-medium">
            {getCustomerName(customer)}
          </div>
        </div>

        <div>
          <div className="text-sm text-base-content/60">
            {t("events.customerCard.customerNo")}
          </div>
          <div>{customer.customerNo}</div>
        </div>

        <div>
          <div className="text-sm text-base-content/60">
            {t("events.customerCard.email")}
          </div>
          <div>{customer.email || "—"}</div>
        </div>

        <div>
          <div className="text-sm text-base-content/60">
            {t("events.customerCard.phone")}
          </div>
          <div>{customer.phone || "—"}</div>
        </div>
      </div>
    </motion.div>
  );
}
