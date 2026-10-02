import { motion } from "motion/react";
export function DashboardPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1>Dashboard</h1>
      <p>Willkommen bei Nexus Events ERP.</p>

      <div>
        <article>
          <h3>Events</h3>
          <p>Veranstaltungen verwalten</p>
        </article>

        <article>
          <h3>Customers</h3>
          <p>Kunden verwalten</p>
        </article>

        <article>
          <h3>Inventory</h3>
          <p>Equipment und Lager verwalten</p>
        </article>

        <article>
          <h3>Invoices</h3>
          <p>Rechnungen verwalten</p>
        </article>
      </div>
    </motion.section>
  );
}
