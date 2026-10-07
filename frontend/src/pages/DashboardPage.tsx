import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1>{t("dashboard.title")}</h1>
      <p>{t("dashboard.welcome")}</p>

      <div>
        <article>
          <h3>{t("navigation.events")}</h3>
          <p>{t("dashboard.manageEvents")}</p>
        </article>

        <article>
          <h3>{t("navigation.customers")}</h3>
          <p>{t("dashboard.manageCustomers")}</p>
        </article>

        <article>
          <h3>{t("navigation.inventory")}</h3>
          <p>{t("dashboard.manageInventory")}</p>
        </article>

        <article>
          <h3>{t("navigation.invoices")}</h3>
          <p>{t("dashboard.manageInvoices")}</p>
        </article>
      </div>
    </motion.section>
  );
}
